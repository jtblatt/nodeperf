try {
    var http = require('http');
    var fs = require('fs');
    
    var config = {};
    var logger;
    var numResponses = 0;
    
    if (3 > process.argv.length) {
        console.log("usage: node echo_server.js <json config file>");
        process.exit(1);
    }
    
    (function readConfig() {    
        var data = fs.readFileSync(process.argv[2]);

        config = JSON.parse(data.toString());
        
        config.port = config.port || 8080;

        logger = require('./logger.js').getLogger('Proxy' + config.port, config.loglevel || 'INFO');
    })();

    if (logger.isInfoEnabled()) {
        logger.info('Starting server');
    }
    
    var exitFunction = function() {
        if (logger.isInfoEnabled()) {
            logger.info('Served ', numResponses, ' requests.');
        }
        
        process.exit(0);
    };
    
    process.on('SIGTERM', exitFunction);
    process.on('SIGINT', exitFunction);

    var workSimulator = require('./work_simulator.js').createWorkSimulator(logger, config);
    
    var server = http.createServer(function(inboundRequest, inboundResponse) {
        try {
            var outboundRequests = [];
            var outboundRequestsFinished = 0;
            
            // 1. Process inbound request headers
            
            if (logger.isTraceEnabled()) {
                logger.trace("RECV_IN: new connection from", inboundRequest.connection.remoteAddress);
            }

            var inboundRequestLine = inboundRequest.method + ' ' + inboundRequest.url + ' HTTP/' + inboundRequest.httpVersion;

            if (logger.isTraceEnabled()) {
                logger.trace("RECV_IN:", inboundRequestLine);

                for ( var fieldName in inboundRequest.headers) {
                    if (inboundRequest.headers.hasOwnProperty(fieldName)) {
                        logger.trace("RECV_IN:", fieldName, ':', inboundRequest.headers[fieldName]);
                    }
                }
            } else if (logger.isDebugEnabled()) {
                logger.debug("RECV_IN:", inboundRequestLine);
            }
                       
            inboundRequest.addListener('data', function(chunk) {
                // 5. Stream request body to all origin servers (fan-out) 
                
                if (logger.isTraceEnabled()) {
                    logger.trace('RECV_IN: read', chunk.length, 'byte chunk');
                }
                
                for (var i = 0; i < outboundRequests.length; ++i) {
                    outboundRequests[i].write(chunk);
                    
                    if (logger.isTraceEnabled()) {
                        logger.trace('SEND_OUT: wrote', chunk.length, 'byte chunk');
                    }
                }                    
            });

            inboundRequest.addListener('end', function() {      
                // 6. End requests sent to all origin servers (fan-out)
                
                if (logger.isTraceEnabled()) {
                    logger.trace('RECV_IN: Finished request body');
                }

                for (var i = 0; i < outboundRequests.length; ++i) {
                    outboundRequests[i].end();
                    
                    if (logger.isTraceEnabled()) {
                        logger.trace('SEND_OUT: Finished request body');
                    }
                }
            }); 
            
            // 2. Do some work before initiating connections to origin servers
            
            workSimulator.processTick();
            
            // 3. Forward HTTP request headers to all origin servers (fan-out)
            
            for (var i = 0; i < config.origins.length; ++i) {
                (function() {
                    var hostname = config.origins[i].hostname;
                    var port = config.origins[i].port;
                    
                    var client = http.createClient(port, hostname);
    
                    client.on('error', function(error) {
                        if (logger.isErrorEnabled()) {
                            logger.error('RECV_OUT: Error proxying to', hostname, port, error);
                        }
                    });
    
                    client.on('close', function() {
                        if (logger.isTraceEnabled()) {
                            logger.trace('RECV_OUT: Connection to', hostname, port, 'closed');
                        }
                    });
    
                    outboundRequests[i] = client.request(inboundRequest.method, inboundRequest.url, inboundRequest.headers);
    
                    outboundRequests[i].on('response', function(outboundResponse) {
                        // 7.  Process origin server responses
                        
                        if (logger.isTraceEnabled()) {
                            logger.trace("RECV_OUT:", outboundResponse.statusCode);
    
                            for (var fieldName in outboundResponse.headers) {
                                if (outboundResponse.headers.hasOwnProperty(fieldName)) {
                                    logger.trace("RECV_OUT:", fieldName, ':', outboundResponse.headers[fieldName], 'from', hostname, port);
                                }
                            }
                        } else if (logger.isDebugEnabled()) {
                            logger.debug("RECV_OUT:", outboundResponse.statusCode, 'from', hostname, port);
                        }
                        
                        if (200 > outboundResponse.statusCode || 300 <= outboundResponse.statusCode) {
                            if (logger.isErrorEnabled()) {
                                logger.error('RECV_OUT:', outboundResponse.statusCode, 'response proxying to', hostname, port);
                            }
                        }
                            
                        outboundResponse.addListener('timeout', function(error) {
                            if (logger.isErrorEnabled()) {
                                logger.trace('RECV_OUT: Timed out proxying to', hostname, port);
                            }
                        });
    
                        outboundResponse.addListener('data', function(chunk) {
                            // 8. Stream origin server body chunks back to client (fan-in)
                            
                            if (logger.isTraceEnabled()) {
                                logger.trace('RECV_OUT: read', chunk.length, 'byte chunk from', hostname, port);
                            }
                            
                            inboundResponse.write(chunk);
                                
                            if (logger.isTraceEnabled()) {
                                logger.trace('SEND_IN: wrote', chunk.length, 'byte chunk from', hostname, port);
                            }                        
                        });
    
                        outboundResponse.addListener('end', function() {
                            // 9. End the client response when the last origin server response
                            // is finished (fan-in).
                            
                            outboundRequestsFinished++;
                            
                            if (logger.isTraceEnabled()) {
                                logger.trace('RECV_OUT: Finished response body from', hostname, port);
                            }
                            
                            if (outboundRequestsFinished < outboundRequests.length) {
                                return;
                            }
    
                            inboundResponse.end();
                                
                            if (logger.isTraceEnabled()) {
                                logger.trace('SEND_OUT: Finished response body');
                            }
                        });
                    });
                })();
            }
            
            // 4. Send 200 OK to client
            
            inboundResponse.writeHead(200, {
                'content-type' : 'text/plain; charset=utf-8'
            });

            if (logger.isTraceEnabled()) {
                logger.trace('SEND_IN: wrote response headers');
            }
        } catch (error) {
            var body = {
                'message' : error.toString()
            };

            if (error.stack) {
                body.stack = error.stack;
            }

            inboundResponse.writeHead(500, {
                'Content-Type' : 'application/json; charset=utf-8'
            });
            
            inboundResponse.end(JSON.stringify(body))
        }
    }).listen(config.port);

    if (logger.isInfoEnabled()) {
        logger.info('Listening on port:', config.port);
    }

} catch (error) {
    if (logger) {
        logger.fatal("Cannot start:", error);
    } else {
        console.log("Start failed: " + error.stack || error.toString());
    }

    process.exit(1);
}
