"use strict";

var mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var tagtypeSchema = new mongoose.Schema({
	"tagTypeId" : {type: String},
	"globalTags" : [{type: String}],
	"personalizedTags" : [{type: String}],
}, {"collection": "tagtypes"})

module.exports = mongoose.model('TagType', tagtypeSchema);