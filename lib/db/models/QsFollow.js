"use strict";

var mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var qsFollowSchema = new mongoose.Schema({
    "catId" : {type: String},
    "stkId" : {type: String},
    "setId" : {type: String},
    "StickerInfo" : [
        {
            "stkId" : {type: String},
            "catId" : {type: String}
        }
    ]
}, {"collection": "followUp_stickers"})

module.exports = mongoose.model('QsFollow', qsFollowSchema);
