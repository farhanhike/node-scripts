"use strict";

var mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var legacyStickerSchema = new mongoose.Schema({
	"stickerId" : {type: Number},
	"sensitive" : {type: Number},
	"catId" : {type: String},
	"sId" : {type: String},
	"img_avail": {
		"an": {type: Boolean},
		"anmn": {type: Boolean},
		"st": {type: Boolean},
		"stmn": {type: Boolean},
	},
	"imageResRegular": {
		"XHDPI": {
			"width": {type: Number},
			"height": {type: Number}
		},
		"NOKIA": {
			"width": {type: Number},
			"height": {type: Number}
		},
		"WIN": {
			"width": {type: Number},
			"height": {type: Number}
		},
		"HDPI": {
			"width": {type: Number},
			"height": {type: Number}
		},
		"XXHDPI": {
			"width": {type: Number},
			"height": {type: Number}
		},
		"XXXHDPI": {
			"width": {type: Number},
			"height": {type: Number}
		},
		"WVGA": {
			"width": {type: Number},
			"height": {type: Number}
		},
		"MDPI": {
			"width": {type: Number},
			"height": {type: Number}
		},
		"BB": {
			"width": {type: Number},
			"height": {type: Number}
		},
		"LDPI": {
			"width": {type: Number},
			"height": {type: Number}
		},
	}
}, {"collection": "stickerdata"})

module.exports = mongoose.model('LegacySticker', legacyStickerSchema);
