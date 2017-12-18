"use strict";

var mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var qsReplySchema = new mongoose.Schema({
    "catId" : {type: String},
    "stkId" : {type: String},
    "setId" : {type: String},
    "StickerInfo" : [
        {
            "stkId" : {type: String},
            "catId" : {type: String}
        }
    ]
}, {"collection": "quickReply_new"})

module.exports = mongoose.model('QsReply', qsReplySchema);
