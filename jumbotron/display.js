// ======================================================================
// Display

var utils = require('./utils');
var params = require('./params');
var Client = require('./client');
var Viewport = require('./viewport');

var debug = utils.debug;

// Constructor
function Display(options) {
    Client.call(this, options);

    options = options || {};

    // Aspect Ratio
    this.aspectRatio = options.aspectRatio || 1;

    // Where this display is in the jumbotron, normalized
    this.viewport = new Viewport(options.viewport);
}

// Subclass and Members
Display.prototype = utils.inherits(Client, {

    // Client type
    type: "display",

    // Serialize
    toJSON: function toJSON() {
	var ret = Client.prototype.toJSON.call(this);
	ret.aspectRatio = this.aspectRatio;
	ret.viewport = this.viewport;
	return ret;
    },

    isCalibrated: function isCalibrated() {
	return ! this.viewport.isEmpty();
    },

    sendLoad: function sendLoad() {
	var jumbotron = this.jumbotron;
	var src       = jumbotron.getDisplayImage(this).source;
	var viewport  = jumbotron.getDisplayViewport(this);
	var frozen    = jumbotron.getDisplayFrozen(this);
	if (utils.isStartsWith(src, params.resourceDir))
	    src = src.substring(params.resourceDir.length + 1); // +1 for '/'
	this.sendMsg('load', { src: src,
			       vp: viewport,
 			       frozen: frozen });
    },

    sendViewport: function sendViewport() {
	var viewport = this.jumbotron.getDisplayViewport(this);
	this.sendMsg('vp', viewport);
    },

    sendPongStart: function sendPongStart() {
      this.sendMesg('pongStart');  
    },
    
    sendShow: function sendShow(options) {
	this.sendMsg('show', options);
    }

});

// Export
module.exports = Display;
