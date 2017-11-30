var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var multer = require('multer');

// var search = require('./routes/search');

var app = express();
var db = require('./lib/db/mongo');
// var stickers = require('./lib/controllers/sticker');
// var imageUpdate = require('./lib/controllers/imageUpdate');
var imageMigration = require('./lib/controllers/imageMigration');

// view engine setup
app.set('views', path.join(__dirname, 'app'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'app')));

// app.use('/search', search);

// app.get('/', function(req, res, next) {
// 	res.render('search')
// })

module.exports = app;
