try {
    var http = require('http');
    var config;
    var logger = ...;

    (function readConfig() {
        var fs = require('fs');

        // synchronous read
        var data = fs.readFileSync(__dirname + '/echo_server.json');

        config = JSON.parse(data);
    })();

    if (logger.isInfoEnabled()) {
        logger.info('Starting server');
    }

    var server = http.createServer(function(request, response) {
        var requestLine;

        try {
            if (logger.isTraceEnabled()) {
                logger.trace("Accepted new connection from " + request.connection.remoteAddress);
            }

            requestLine = request.method + ' ' + request.url + ' HTTP/' + request.httpVersion;

            if (logger.isTraceEnabled()) {
                logger.trace("Received request: " + requestLine);

                for ( var fieldName in request.headers) {
                    if (request.headers.hasOwnProperty(fieldName)) {
                        logger.trace(fieldName + ': ' + request.headers[fieldName]);
                    }
                }
            } else if (logger.isDebugEnabled()) {
                logger.trace("Received request: " + requestLine);
            }
            
            // TODO

        } catch (error) {
            // TODO
        }
    });

    if (logger.isInfoEnabled()) {
        logger.info('Listening');
    }

} catch (error) {
    if (logger) {
        logger.fatal("Start failed: " + error.stack || error.toString());
    } else {
        console.log("Start failed: " + error.stack || error.toString());
    }

    process.exit(1);
}


