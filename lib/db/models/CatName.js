"use strict";

var mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var catnameSchema = new mongoose.Schema({
	"catId" : {type: String},
	"name" : {type: String},
	"desc" : {type: String},
	"ucid" : {type: Number},
	"act_stickers" : [{type:String}],
	"disabled" : [{type:String}],
	"size" : {
		"XHDPI" : {type: Number, default:0},
		"NOKIA" : {type: Number, default:0},
		"WIN" : {type: Number, default:0},
		"HDPI" : {type: Number, default:0},
		"XXHDPI" : {type: Number, default:0},
		"XXXHDPI" : {type: Number, default:0},
		"WVGA" : {type: Number, default:0},
		"MDPI" : {type: Number, default:0},
		"BB" : {type: Number, default:0},
		"LDPI" : {type: Number, default:0}
	},
	"nos" : {type: Number},
	"copyright" : {type: String},
	"state" : {type: String},
	"ts" : {type: Number},
	"sizex" : {
		"XHDPI" : {
			"st_only" : {type: Number, default:0},
			"st_+_anim" : {type: Number, default:0},
		},
		"NOKIA" : {
			"st_only" : {type: Number, default:0},
			"st_+_anim" : {type: Number, default:0},
		},
		"WIN" : {
			"st_only" : {type: Number, default:0},
			"st_+_anim" : {type: Number, default:0},
		},
		"HDPI" : {
			"st_only" : {type: Number, default:0},
			"st_+_anim" : {type: Number, default:0}
		},
		"XXHDPI" : {
			"st_only" : {type: Number, default:0},
			"st_+_anim" : {type: Number, default:0}
		},
		"XXXHDPI" : {
			"st_only" : {type: Number, default:0},
			"st_+_anim" : {type: Number, default:0}
		},
		"WVGA" : {
			"st_only" : {type: Number, default:0},
			"st_+_anim" : {type: Number, default:0}
		},
		"MDPI" : {
			"st_only" : {type: Number, default:0},
			"st_+_anim" : {type: Number, default:0}
		},
		"BB" : {
			"st_only" : {type: Number, default:0},
			"st_+_anim" : {type: Number, default:0}
		},
		"LDPI" : {
			"st_only" : {type: Number, default:0},
			"st_+_anim" : {type: Number, default:0}
		}
	},
	"nosx" : {
		"st_only" : {type: Number},
		"st_+_anim" : {type: Number}
	},
	"isregion" : {type: String},
	"stories" : []
}, { collection: 'catname' })

module.exports = mongoose.model('CatName', catnameSchema);
