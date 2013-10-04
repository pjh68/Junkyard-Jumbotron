// ======================================================================
// Utilities
function bind(instance, method) {
    return function() { return method.apply(instance, arguments); };
}

function isFunction(obj) {
    return !! (obj && obj.constructor && obj.call && obj.apply);
}

function isArguments(obj) {
    return !! (obj && Object.prototype.hasOwnProperty.call(obj, 'callee'));
}

function isString(obj) {
    return !! (obj === '' || (obj && obj.charCodeAt && obj.substr));
}

function isUndefined(obj) {
    return obj === void 0;
}

function parseQuery(options) {
    options = options || [];
    var query = $.parseQuery();
    for (var q in query) {
	if (q)  // bug in parseQuery returns '' in the query string
	    options[q] = query[q];
    }
    return options;
}

// Return string version of an object
function stringify(obj) {
    if (obj === null)
	return "null";
    if (isUndefined(obj))
	return "undefined";
    if (isString(obj))
	return obj;  // string
    if (isArguments(obj)) {
	var msg = '';
	var numArgs = obj.length;
	for (var a = 0; a < numArgs; a++) {
	    msg += stringify(obj[a]);
	    msg += ' ';
	}
	return msg;
    }
    if (obj.transport)
	return obj.toString(); // socket
    return JSON.stringify(obj);
}

// Format {0} and {1}
function format(str) {
    var parts = str.split(/\{([0-9]+)\}/);
    for (var p = 1; p < parts.length; p += 2)
	parts[p] = arguments[parseInt(parts[p]) + 1];
    return parts.join('');
}

var console;
if (! console) {
    console = { debug: function() {},
		log: function() {} };
}

var io;
if (io) {
    io.Socket.prototype.toString = function() {
	var type = this.transport ? this.transport.type : "no-transport";
	return (type + ' ('
		+ (this.connected ? "connected" : "disconnected")
		+ (this.connecting ? ", connecting" : "")
		+ ')');
    };
}

// ======================================================================
// Base class for Display and Controller.

function Client() {
    this.query = parseQuery({ debug: 'false',
			      trace: 'false' });
    this.doDebug = this.query.debug == 'undefined' || this.query.debug == 'true';
    this.doTrace = this.query.trace == 'undefined' || this.query.trace == 'true';
    this.socket = null;
    this.pingTimer = null;
}

Client.prototype = {

    initSocket: function initSocket() {
	var socket = this.socket = new io.Socket(null, {
	    // Everything but flashsocket, as per comments in google groups
	    //   (flashsocket are not working well in Android)
	    transports: ['websocket', 'htmlfile', 'xhr-multipart',
			 'xhr-polling', 'jsonp-polling'],
	    connectTimeout: 5000,
	    tryTransportsOnConnectTimeout: true,
	    rememberTransport: true
	});

	// socket.90 v0.6.8: timeout doesn't work very well
	socket.on('connect', bind(this, function() {
	    this.info('Connected with', this.socket);
	    // Stop any pending connect
	    this.sendInitMsg();

	    var browser = navigator.appVersion || navigator.userAgent || "None";
	    if (! navigator.cookieEnabled) 
		browser += " NO COOKIES";
	    this.info("Browser", browser);
	}));
	socket.on('message', bind(this, this.handleMsg));
	socket.on('connect_failed', bind(this, function() {
	    // Wait a bit and then try to reconnect
	    var delay = 5;
	    this.info("Connection failed, trying again in", delay, "second(s)");
	    setTimeout(bind(this, this.connectSocket), delay * 1000);
	}));
	socket.on('disconnect', bind(this, function() {
	    // Wait a bit and then try to reconnect
	    var delay = 1;
	    this.info("Disconnected, trying again in", delay, "second(s)");
	    setTimeout(bind(this, this.connectSocket), delay * 1000);
	}));
	this.connectSocket();
    },

    connectSocket: function connectSocket() {
	var socket = this.socket;
	if (! socket.connected && ! socket.connecting) {
	    this.info('Connecting to', socket.host, socket.options.port);
	    socket.connect();
	}
    },

    startPinging: function startPinging() {
	if (! this.pingTimer)
	    this.pingTimer = setInterval(bind(this, this.ping), 60000);
    },

    stopPinging: function stopPinging() {
	if (this.pingTimer) {
	    clearInterval(this.pingTimer);
	    this.pingTimer = null;
	}
    },

    // ----------------------------------------------------------------------
    // Communication 

    trace: function trace() {
	if (this.doTrace) {
	    var msg = stringify(arguments);
	    console.log(msg);
	}
    },

    debug: function debug() {
	if (this.doDebug) {
	    var msg = stringify(arguments);
	    console.log(msg);
	    this.sendMsg('log', { level: 'debug', msg: msg});
	}
    },

    info: function info() {
	var msg = stringify(arguments);
	console.log(msg);
	if (this.doDebug)
	    this.sendMsg('log', { level: 'info', msg: msg});
    },

    error: function error() {
	var msg = stringify(arguments);
	console.log('ERROR: ' + msg);
	this.sendMsg('log', { level: 'error', msg: msg});
    },

    ping: function ping() {
	this.info("Alive");
    },
	
    sendMsg: function sendMsg(cmd, args) {
	this.trace(">", cmd, JSON.stringify(args));
	if (this.socket)
	    this.socket.send(JSON.stringify({cmd: cmd, args: args}));
    },

    sendInitMsg: function sendInitMsg(msg) {
	// Subclasses should override this
    },


    // Subclass must create msgHandlers
    handleMsg: function handleMsg(msg) {
        try {
            var data = JSON.parse(msg);
        }
        catch (SyntaxError) {
            this.error('Invalid JSON:', msg);
            return;
        }
    
        try {
            this.trace("<", data.cmd, JSON.stringify(data.args));
            console.log('£££££££££££££');
            console.log(this.msgHandlers);
            console.log('£££££££££££££');
            var handler = this.msgHandlers[data.cmd];
            if (! handler)
            return this.error("Unknown command:", data.cmd);
            handler.call(this, data.args);
        }
        catch (exception) {
            this.error(exception.message + " (" + msg + ")");
            this.error(exception.stack);
        }
    }
};
