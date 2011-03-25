var getLogger = function(name, levelString, formatter, appender) {

	// private methods and variables

    var util = require('util');

	var pid = process.pid;
	var tid = 0;
	var count = 0;
	var now = new Date().toUTCString();

	var TRACE = 0;
	var DEBUG = 1;
	var INFO = 2;
	var WARN = 3;
	var ERROR = 4;
	var FATAL = 5;

	var levels = {
		'trace' : TRACE,
		'debug' : DEBUG,
		'info' : INFO,
		'warn' : WARN,
		'error' : ERROR,
		'fatal' : FATAL
	};

	if (!name) {
		throw new Error("Logger name is required");
	}

	var level = levels[levelString.toLowerCase()];

	if (undefined === level) {
		throw new Error("Unknown level: " + levelString);
	}

	// always log fatal messages

	if (level >= FATAL) {
		level = ERROR;
	}

	if (!formatter) {
		formatter = function(args) {	
		    
			if (0 == (++count % 100)) {
				now = new Date().toUTCString();
			}

			var array = [ '[', now, '][', pid, '][', tid, '][', name, ']' ];

			for (var i = 0; i < args.length; ++i) {
			    array = array.concat(args[i]);
			}

			array = array.concat('\n');

			if (args[args.length - 1] && args[args.length - 1].stack) {
				array = array.concat(args[args.length - 1].stack);
				array = array.concat('\n');
			}

			return array.join(' ');
		};
	}

	if (!appender) {
		appender = function(message) {
			process.stdout.write(message);
		}
	}

	// public methods

	return {
		isTraceEnabled : function() {
			return TRACE >= level;
		},

		isDebugEnabled : function() {
			return DEBUG >= level;
		},

		isInfoEnabled : function() {
			return INFO >= level;
		},

		isWarnEnabled : function() {
			return WARN >= level;
		},

		isErrorEnabled : function() {
			return ERROR >= level;
		},

		isFatalEnabled : function() {
			return FATAL >= level;
		},

		trace : function() {
			if (!this.isTraceEnabled()) {
				return;
			}

			appender(formatter(arguments));
		},

		debug : function() {
			if (!this.isDebugEnabled()) {
				return;
			}

			appender(formatter(arguments));
		},

		info : function() {
			if (!this.isInfoEnabled()) {
				return;
			}

			appender(formatter(arguments));
		},

		warn : function() {
			if (!this.isWarnEnabled()) {
				return;
			}

			appender(formatter(arguments));
		},

		error : function() {
			if (!this.isErrorEnabled()) {
				return;
			}

			appender(formatter(arguments));
		},

		fatal : function() {
			if (!this.isFatalEnabled()) {
				return;
			}

			appender(formatter(arguments));
		}
	};
};

module.exports.getLogger = getLogger;
