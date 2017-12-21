"use strict";

var mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var stickerSchema = new mongoose.Schema({
	"stickerId" : {type: Number},
	"lsid" : {type: String},
	"lcid" : {type: String},
	"lang" : {type: String},
	"isAnim" : {type: Boolean},
	"abusiveLevel" : {type: Number, default: 0},
	"isSensitive" : {type: Boolean, default: false},
	"tagTypeId" : [{type: String}],
	"title" : {type: String},
	"atime" : {type: Number, default: -1},
	"additionalTags" : [{type: String}],
	"typos" : [{type: String}],
	"images" : {
		"mini" : {
			"MDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"HDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"XHDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"LDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"XXHDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			}
		},
		"staticRegular" : {
			"MDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"HDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"XHDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"LDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"XXHDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			}
		},
		"animRegular" : {
			"MDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"HDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"XHDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"LDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			},
			"XXHDPI" : {
				"host": {type:String},
				"s3Path" : {type: String},
				"gcsPath" : {type: String},
				"cloudinaryPath": {type: String},
				"width": {type: Number},
				"height": {type: Number},
				"size": {type: Number}
			}
		}
	}
}, {"collection": "stickers"})

module.exports = mongoose.model('Sticker', stickerSchema);