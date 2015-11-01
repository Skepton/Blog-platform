//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http'),
    path = require('path'),
    async = require('async'),
    favicon = require('static-favicon'),
    session = require('express-session'),
    swig = require('swig'),
    redis = require("redis").createClient(),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    passport = require('passport'),
    RedisStore = require('connect-redis')(session),
    express = require('express');

var app = express();

app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'html');
swig.setDefaults({ cache: false });

app.use(favicon())
	.use(express.static(path.join(__dirname, 'public')))
	.use(bodyParser.json())
	.use(bodyParser.urlencoded())
	.use(cookieParser())
	.use(session({
		store: new RedisStore({client: redis }),
		secret: 'Tango Down',
		cookie: { maxAge : 604800000 },
		saveUninitialized: false,
		resave: false
	}))
	.use(passport.initialize())
	.use(passport.session());

// development error handler
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Express listening at", addr.address + ":" + addr.port);
});

module.exports.app = app;

require('./route');
