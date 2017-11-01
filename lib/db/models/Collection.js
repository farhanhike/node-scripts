"use strict";

var mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var stkCollections = new mongoose.Schema({
	"collectionId" : {type: Number},
	"lcid" : {type: String},
	"name" : {type: String},
	"description" : {type: String},
	"collegeId" : {type: String},
	"copyright" : {type: String},
	"stickers" : [{type: Number}],
}, {"collection": "stkCollections"})

module.exports = mongoose.model('Collection', stkCollections);