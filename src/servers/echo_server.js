try {
    var http = require('http');
    var config = { };
    var logger;

    (function readConfig() {
        var data = require('fs').readFileSync(__dirname + '/echo_server.json');
                
        config = JSON.parse(data.toString());

        logger = require('./logger.js').getLogger('EchoServer', config.loglevel || 'INFO');

        config.port = config.port || 8080;
    })();

    if (logger.isInfoEnabled()) {
        logger.info('Starting server');
    }

    var server = http.createServer(function(request, response) {
        var requestLine;

        try {
            if (logger.isTraceEnabled()) {
                logger.trace("Accepted new connection from", request.connection.remoteAddress);
            }

            requestLine = request.method + ' ' + request.url + ' HTTP/' + request.httpVersion;

            if (logger.isTraceEnabled()) {
                logger.trace("RECV_IN:", requestLine);

                for ( var fieldName in request.headers) {
                    if (request.headers.hasOwnProperty(fieldName)) {
                        logger.trace("RECV_IN:", fieldName, ':', request.headers[fieldName]);
                    }
                }
            } else if (logger.isDebugEnabled()) {
                logger.debug("RECV_IN:", requestLine);
            }  

            // TODO - allocate objects and do computation according to config file

            var contentType = request.headers['content-type'];
                        
            if (!contentType) {
                response.writeHead(200);
                response.end();
                
                if (logger.isTraceEnabled()) {
                    logger.trace('Response headers sent, no body');
                }
                
                return;
            }
            
            response.writeHead(200, {
                'content-type' : contentType
            });
            
            if (logger.isTraceEnabled()) {
                logger.trace('Response headers sent');
            }
            
            // TODO - streaming echo response back to client will deadlock if response buffer fills up before client starts reading it
            
            request.addListener('data', function(chunk) {
                if (logger.isTraceEnabled()) {
                    logger.trace('Sent chunk of size:', chunk.length);
                }
                
                response.write(chunk);
            });

            request.addListener('end', function() {
                if (logger.isTraceEnabled()) {
                    logger.trace('Finished response');
                }
                
                response.end();
            });

        } catch (error) {
            var body = {
                'message' : error.toString()
            };

            if (error.stack) {
                body.stack = error.stack;
            }

            response.writeHead(500, {
                'Content-Type' : 'application/json; charset=utf-8'
            });
            response.end(JSON.stringify(body))
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
