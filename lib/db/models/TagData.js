"use strict";

var mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var tagdataSchema = new mongoose.Schema({
	"catId" : {type: String},
	"sId" : {type: String},
	"script" : {type: String},
	"lang" : {type: String},
	"*atime" : {type: String},
	"*aslangdeg" : {type: String},
	"*creaction" : [{type: String}],
	"*ctheme" : [{type: String}],
	"*ctitle" : [{type: String}],
	"timestamp" : {type: Date, default: Date.now}
}, {"collection": "tagdata"})

module.exports = mongoose.model('TagData', tagdataSchema);
