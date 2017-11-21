'use strict';

var mongoose = require('mongoose');
exports.mongoose = mongoose;
// Configure for possible deployment
var uristring = "mongodb://localhost:27017/stickerdb"
// var uristring = "mongodb://10.0.1.141:27017,10.0.7.141:27107/stickerdb" // staging uri
// var uristring = "mongodb://10.9.17.155:27017,10.9.17.156:27017,10.0.0.21:27107,10.0.5.21:27017/stickerdb?replicaSet=stickers" // content-qa uri
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

require('./models/CatName');
require('./models/TagType');
require('./models/TagData');
require('./models/Sticker');
require('./models/Collection');
require('./models/LegacySticker');
