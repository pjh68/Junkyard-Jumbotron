// ======================================================================
// Params - global parameters

var join = require('path').join;

module.exports = {

    // Server listens on this port. NOTE: If you change this, also
    // change it in the apache configs and in jjclient.js.
    port: 8080,

    // Regexp for allowable jumbotron names
    jumbotronRegExp:  /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,

    // Disallowed jumbotron names
    jumbotronReserved: { postmaster: 1,
			 abuse	: 1,
			 spam	: 1,
			 help	: 1,
			 info	: 1,
			 noreply: 1,
			 admin	: 1, 
			 jumbotron : 1,
			 'undefined' : 1,
			 'mailer-daemon': 1 },

    // File size and type limits
    allowedFileTypes: { jpg : 1,
			jpeg: 1,
			png : 1,
			gif : 1 },
    maxFileSize: 2.5, // Individual file size limit, in megabytes
    //UNUSEDmaxTotalSize: 100, // Total limit per jumbotron

    // Directory for temporary file uploads
    tmpDir: '/tmp',

    // Public resource directory for web clients
    resourceDir: 'public',

    // Directory with jumbotron directories (with images and icons)
    jumbotronsDir: join('public', 'jumbotrons'),

    // Directory with sample images
    samplesDir: join('public', 'samples'),

    // Database directory
    databaseDir: join('private', 'database'),

    // Directory with jade template files
    viewsDir: join('private', 'views'),

    // Image shown on all the displays after a calibration
    calibratedImageOptions: {
	source: join('public', 'images', 'grid.png'),
	width: 1024,
	height: 768
    },

    // Image shown on a display whose marker was not found
    errorImageOptions: {
	source: join('public', 'images', 'error.png'),
	width: 1024,
	height: 768
    },

    // Marker images
    markerImageOptions: {
	sourceFormat: join('public', 'markers', 'bch_large', 'BchThin_%04d.png'),
	width: 1000,
	height: 1000
    },

    // Thumbnails for admin and controller views
    thumbnailImageSize: 80,

    // How long to delay between making a change to a jumbotorn and
    // committing that change to disk. All changes made in the ensuing
    // interval will be committed in one go.
    commitDelay: 1 * 60, // 1 minute
 
    // Handle log, warning, and error messages
    logging: {
	// Log messages to the console
	useConsole: true,

	// Log messages to a file
	useFile: true,
	filename: join('private', 'logs', 'output.log'),

	// Rotating log file details
	maxFileSize: 4 * 1024 * 1024, // Maximum number of bytes per file 
	backups: 10,               // How many files to keep
	pollInterval: 60           // Seconds between checking the file size
    },

    // Python script(s)
    pythonPath: '/usr/local/bin:/usr/bin',
    python: 'python',
    calibrateScript: join('python', 'calibrate.py'),

    // sendmail info SMTP server info (override in paramsLocal.js)
    emailReplyTo: "info@thisserver.com",

    // The server that will receive emails of the form 
    // [jumbotron-name]@thiserver.com.  Override this in paramLocal.js
    imageReceiveServer: '@thisserver.com',
	
    // Debug level 'INFO', 'DEBUG', 'TRACE'
    debug: 'DEBUG'
};

// Merge in local changes, if any
var utils = require('./utils');
try {
    var local = require('./paramsLocal');
    utils.extend(module.exports, local);
    // Save the local parameters so we can log about them later
    module.exports.localParams = local;
}
catch (exception) {
    if (! utils.isStartsWith(exception.message, 'Cannot find module'))
	throw exception;
}
