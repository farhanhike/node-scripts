"use strict";

var mongoose 				= require('mongoose')
	, async 					= require('async')
	, _ 							= require('underscore')
	, ObjectId 				= mongoose.Types.ObjectId
	, Sticker   			= mongoose.model('Sticker')
	, TagType   			= mongoose.model('TagType')
	, TagData   			= mongoose.model('TagData')
	;

 function insertTypos() {
	Sticker.find({}).exec(function(error, stickers) {
		if(error) {
			console.log(error)
		}
		else {
			console.log("Toatal stickers : "+ stickers.length)
			async.eachSeries(stickers, function(sticker, callback) {
				async.parallel({
					creaction: function(callback) {
						TagData.find({sId: sticker.lsid, catId: sticker.lcid}, {"*creaction":1}, function(error, tagdata) {
							if(error) {
								callback(error, null)
							}
							else {
								var creactions = [];
								for(var i=0; i<tagdata.length; i++) {
									var data = tagdata[i]
									if(data && data["*creaction"]) {
										creactions = _.union(creactions, data["*creaction"])
									}
								}
								callback(null, creactions)
							}
						})
					},
					tags: function(callback) {
						if(sticker.tagTypeId && sticker.tagTypeId.length > 0) {
							TagType.find({tagTypeId: {$in : sticker.tagTypeId}}, function(error, tagtypes) {
								if(error) {
									callback(error, null)
								}
								else {
									var tags = [];
									for(var i=0; i<tagtypes.length; i++) {
										var tagtype = tagtypes[i]
										var stickerTags = tagtype["globalTags"]
										if(tagtype["personalizedTags"]) {
											stickerTags = _.union(stickerTags, tagtype["personalizedTags"])
										}
										tags = _.union(tags, stickerTags)
									}
									callback(null, tags)
								}
							})
						}
						else {
							callback(null, [])
						}
					}
				}, function(error, values) {
					if(error) {
						callback(error, null)
					}
					else {
						var creactions = values.creaction
						var stickerTags = values.tags
						if(sticker.additionalTags) {
							stickerTags = _.union(stickerTags, sticker.additionalTags)
						}
						var typos = _.difference(creactions, stickerTags)
						if(sticker.typos) {
							typos = _.union(typos, sticker.typos)
						}
						typos = _.without(typos, "")
						if (typos.length) {
							Sticker.update({stickerId: sticker.stickerId}, {$set: {typos: typos}}, function(error, response) {
								if(error) {
									console.log(error)
								}
								else {
									console.log("finsihed updating stickerId : "+ sticker.stickerId)
								}
								callback()
							})
						}
						else {
							callback()
						}
					}
				})
			}, function(error) {
				if(error) {
					console.log(error)
				}
				else {
					console.log("finished")
				}
			})
		}
	})
}

insertTypos()