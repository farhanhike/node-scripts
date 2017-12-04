'use strict';

var mongoose        = require('mongoose')
  , config          = require('config');

exports.mongoose = mongoose;
var uristring = config.get('mongodb.uri')

console.log('uristring = '+uristring);
// var uristring = config.uristring;
var mongoOptions = { db: { safe: true } };

// Create the database connection
mongoose.connect(uristring, mongoOptions);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
  console.log('Mongoose default connection open to ' + uristring);
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {
  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});

// BRING IN YOUR SCHEMAS & MODELS
console.log('bringing in models');

require('./models/Sticker');
require('./models/LegacySticker');
