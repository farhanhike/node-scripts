var mongoose 				= require('mongoose')
	, ObjectId 				= mongoose.Types.ObjectId
	, Sticker   			= mongoose.model('Sticker')
	, LegacySticker   = mongoose.model('LegacySticker')
	, Collection 			= mongoose.model('Collection')
	, redis 					= require("./redisScript")
	, TagData 				= mongoose.model('TagData')

var async = require('async')
var jsonfile = require('jsonfile')
var request = require('request')

exports.populateAllStickersInRedis = function() {
	async.parallel({
		collections: function(callback) {
			Collection.find({collegeId: {$exists: false}}, {stickers:1, lcid:1}).exec(function(error, collections) {
				if(error) {
					callback(error, null)
				}
				else {
					callback(null, collections)
				}
			})
		},
		stickers: function(callback) {
			Sticker.find({}, {lsid:1, lcid:1, stickerId:1}).exec(function(error, stickers) {
				if(error) {
					console.log(error)
					callback(error, null)
				}
				else {
					var stickerDict = {};
					for(var i=0; i<stickers.length; i++) {
						if(stickers[i].lsid) {
							stickerDict[stickers[i].stickerId] = stickers[i].lsid
						}
					}
					callback(null, stickerDict)
				}
			})
		}
	}, function(error, values) {
		if(error) {
			console.log(error)
		}
		else {
			var data = []
			var collections = values.collections;
			var stickerDict = values.stickers
			for (var i=0; i<collections.length; i++) {
				var collection = collections[i]
				if(collection.lcid) {
					for (var j=0; j<collection.stickers.length; j++) {
						if(stickerDict[collection.stickers[j]]) {
							var id = collection.lcid + ":" + stickerDict[collection.stickers[j]]
							data.push(id)				
						}
					}
				}
			}
			if(data.length == 0) {
				console.log('No data found')
				return
			}
			console.log("Total stickers : "+ data.length)
			redis.addStickerIdsToRedis(data, function(error, value) {
				if(error) {
					cconsole.log(error)
				}
				else {
					console.log("Finished")
				}
			})
		}
	})
}

// exports.populateAllStickersInRedis()

exports.insertDefaultTagTypes = function() {
	var tagTypeId = "default_empty";
	Sticker.find({tagTypeId: []}, function(error, stickers) {
		if(error) {
			console.log(error)
		}
		else {
			async.eachLimit(stickers, 50, function(sticker, callback) {
				console.log("Processing stickerId : "+ sticker.stickerId)
				Sticker.update({stickerId: sticker.stickerId}, {$set: {"tagTypeId": [ tagTypeId ]}}, function(error, value) {
					if(error) {
						// console.log(error)
						callback()
					}
					else {
						redis.deleteKey("stickerId:"+sticker.stickerId)
						callback()
					}
				})
			}, function(error) {
				if(error) {
					console.log(error)
				}
				else {
					console.log("Finsished")
				}
			})
		}
	})
}

// exports.insertDefaultTagTypes()

exports.getStickers = function() {
	Sticker.find({}, {stickerId:1, lsid:1, lcid:1, tagTypeId:1, title:1, additionalTags:1, typos:1}).exec(
		function(error, value) {
		if(error) {
			console.log(error)
		}
		else {
			var stickerIds = [];
			for(var i=0; i<value.length; i++) {
				stickerIds.push(value[i].lsid)
			}
			var dict = {}
			TagData.find({sId : {$in: stickerIds}}, function(error, tagdata) {
				if(error) {
					console.log(error)
				}
				else {
					for(var i=0; i<tagdata.length; i++) {
						dict[tagdata[i].catId + ":" +tagdata[i].sId] = tagdata[i]["*creaction"]
					}
					jsonfile.writeFile("stickers.json", dict, {spaces: 2}, function (err) {
						console.log("request finished")
					})
				}
			})
			
		}
	})
}

// exports.getStickers()

var probe = require('probe-image-size');

exports.updateImageDimension = function() {
	Sticker.find({stickerId: 7514}, {stickerId:1, lsid:1, lcid:1, images:1}).limit(1).exec(function(error, stickers) {
		if(error) {
			console.log(error)
		}
		else {
			async.eachSeries(stickers, function(sticker, callback) {
				exports.getStickersFromServer(sticker.stickerId, function(error, value) {
					if(error) {
						console.log(error)
					}
					else if(value && value.imageUrls) {
						var imageUrls;
						var flags = {
							isAnim: false,
							isStaticAvailable: false
						}
						if(value.imageUrls.animRegular) {
							imageUrls = value.imageUrls.animRegular
							flags.isAnim = true
							if(value.imageUrls.staticRegular) {
								flags.isStaticAvailable = true
							}
						}
						else if(value.imageUrls.staticRegular) {
							imageUrls = value.imageUrls.staticRegular
							flags.isStaticAvailable = true
						}
						if(imageUrls) {
							exports.getImageDimension(imageUrls, function(error, response) {
								if(error) {
									console.log("Error in getImageDimension ", error)
									callback()
								}
								else {
									exports.updateImageDimensionInDb(sticker, response, flags, function(error, resp) {
										if(error) {
											callback(error)
										}
										else {
											callback()
										}
									})
								}
							})
						}
						else {
							console.log("No imageurl for stickerId : "+sticker.stickerId)
							callback()
						}
					}
					else {
						console.log("No imageurl for stickerId : "+sticker.stickerId)
						callback()
					}
				})
			}, function(error) {
				if(error) {
					console.log("Error in async ",error)
				}
			}) 
		}
	})
}

exports.getStickersFromServer = function(id, callback) {
	var headers = {
		"Sticker-Console": 1
	}

	var url = "http://staging.im.hike.in/v5/stickers/sticker/id/"+id
	var options = {
		url: url,
		method: 'GET',
		headers: headers,
		json: true
	}
	
	request(options, function(error, res, body) { 
		if(error) {
			callback(error, null)
		}
		else {
			callback(null, body[0])
		}
	});
}

exports.getImageDimension = function(data, callback) {
	console.log("Called")
	var result = {};
	var keys = Object.keys(data)
	for (var key in data) {
		result[key] = {
			width: 0,
			height: 0,
			size: 0
		}
	}
	async.eachSeries(keys, function(key, callback){
		var url = data[key]
		probe(url, function(error, resp) {
			if(error) {
				console.log(error)
				callback(error, null)
			}
			else {
  			result[key]['width'] = resp.width
  			result[key]['height'] = resp.height
  			result[key]['size'] = resp.length
				callback()
			}
		})
	}, function(error) {
		callback(null, result)
	})
}

exports.updateImageDimensionInDb = function(sticker, data, flags, callback) {
	async.parallel({
		legacySticker: function(callback) {
			LegacySticker.update({sId: sticker.lsid, catId: sticker.lcid}, {$set: {"imageResRegular": data}}, function(error, response) {
				if(error) {
					callback(error, null)
				}
				else{
					callback(null, 'done')
				}
			})
		},
		sticker: function(callback) {
			var animUpdateData, staticUpdateData;
			if(flags.isAnim) {
				animUpdateData = sticker.images.animRegular
			}
			if(flags.isStaticAvailable) {
				staticUpdateData = sticker.images.staticRegular
			}

			for (var key in data) {
				if(animUpdateData) {
					animUpdateData[key]["width"] = data[key]['width']
					animUpdateData[key]["height"] = data[key]['height']
					animUpdateData[key]["size"] = data[key]['size']
				}
				if(staticUpdateData) {
					staticUpdateData[key]["width"] = data[key]['width']
					staticUpdateData[key]["height"] = data[key]['height']
					if(animUpdateData == null) {
						staticUpdateData[key]["size"] = data[key]['size']
					}
					else {
						staticUpdateData[key]["size"] = 0
					}
				}
			}
			var updateData = {}
			if(animUpdateData) {
				updateData["images.animRegular"] = animUpdateData
			}
			if(staticUpdateData) {
				updateData["images.staticRegular"] = staticUpdateData
			}

			Sticker.update({stickerId: sticker.stickerId}, {$set: updateData}, function(error, response) {
				if(error) {
					callback(error, null)
				}
				else {
					callback(null, 'done')
				}
			})
		}
	}, function(error, values) {
		if(error) {
			console.log("Error in updateImageDimensionInDb", error)
			callback(error, null)
		}
		else{
			console.log("Updated Image Dimension for stickerId: "+sticker.stickerId)
			callback(null, 'done')
		}
	})
}

// exports.updateImageDimension()