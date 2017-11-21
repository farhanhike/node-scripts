var fs = require('fs');
var path = require('path');
var async = require('async');
var cloudinary = require('cloudinary')
var imageType = require('image-type');
var probe = require('probe-image-size');

var mongoose 				= require('mongoose')
    , ObjectId 				= mongoose.Types.ObjectId
    , Sticker   			= mongoose.model('Sticker')
    , LegacySticker         = mongoose.model('LegacySticker')

var config_path = path.join(process.env.CONFIG_FOLDER, "node-scripts")
var prop = require(path.join(config_path,"properties"))

var constants = {
    gcs_key: path.join(config_path,"gcs_key.json"),
    dropbox_path: prop.dropbox.path,
    project_id: prop.gcs.project_id,
    legacy_gcs_bucket: prop.gcs.legacy_bucket,
    gcs_bucket: prop.gcs.bucket
}

var gcs_config = {
    projectId: constants.project_id,
    keyFilename: constants.gcs_key
};

var gcsStorage = require('@google-cloud/storage')(gcs_config);

cloudinary.config(prop.cloudinary)

var res_dict = {'HDPI':0.4888888889, 'LDPI':0.2222222222, 'MDPI':0.2888888889, 'XHDPI':0.6537037037, 'XXHDPI':1}
var mini_res_factor = 0.359259593

function readDir(source_path, callback) {
    fs.readdir(source_path, (error, folders) => {
        if(error) {
            callback(null, [])
        }
        else {
            folders = folders.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
            callback(null, folders)
        }
    })
}

function getImageDimension(data, callback) {
	var result = {};
	var keys = Object.keys(data)
	for (var key in data) {
		result[key] = {
			width: 0,
			height: 0,
			size: 0
		}
	}
	async.eachLimit(keys, 10, function(key, callback){
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

function getImagePaths(lcids, callback) { 
    var fileData = []
    var mini_image_folder = path.join(constants.dropbox_path, "2_Stickers", "1_Source files","Or_SticMINI")
    async.waterfall([
        (callback) => {
            if(lcids) {
                callback(null, lcids)
            }
            else {
                readDir(mini_image_folder, (error, catIds) => {
                    if(error) {
                        callback(error, null)
                    }
                    else {
                        callback(null, catIds)
                    }
                })
            }
        },
        (catIds, callback) => {
            async.each(catIds, (catId, callback) => {
                var folderPath = path.join(mini_image_folder, catId)
                fs.readdir(folderPath, (err, files) => {
                    files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
                    files.forEach(file => {
                        var info = {
                            catId: catId,
                            sId: file,
                            path: path.join(folderPath, file)
                        }
                        fileData.push(info)
                    });
                    callback()
                })
            }, (error) => {
                callback(null, fileData)
            })
        }
    ], (error, values) => {
        if(error) {
            callback(error, null)
        }
        else {
            callback(null, fileData)
        }
    })
}

function getSticker(info, callback) {
    Sticker.findOne({lcid: info.catId, lsid: info.sId}, (error, sticker) =>{
        if(error) {
            callback(error, null)
        }
        else if(sticker) {
            callback(null, sticker)
        }
        else {
            callback("invalidIds", null)
        }
    })
}

function uploadOnCloudinary(info, callback) {
    var fileMeta = info.fileMeta;
    var sticker = info.sticker;
    var options = {
        folder: "testing/images/"+sticker.stickerId,
        public_id: "mini",
        effect: "trim"
    }
    cloudinary.v2.uploader.upload(fileMeta.path, options, (error, result) => {
        if(error) {
            callback(error, null)
        }
        else {
            callback(null, result)
        }
    })
}

function getTranformedUrl(data, transformation) {
    var transformedUrl = cloudinary.url(data.public_id, {secure: true, 
        version: data.version, width: transformation.width, height: transformation.height, crop: 'scale', 
        quality: "auto:eco", format: 'png' });
    return transformedUrl
}

function getImageMetaForAllResolution(data, callback) {
    var dict = {"XXHDPI": data.url}
    getImageDimension(dict, (error, values) => {
        if(error) {
            callback(error, null)
        }
        else {
            var results = []
            var base_width = values.XXHDPI.width
            var base_height = values.XXHDPI.height
            for (key in res_dict) {
                var meta = {
                    "resType" : key,
                    "width": Math.round(base_width*mini_res_factor),
                    "height": Math.round(base_height*mini_res_factor)
                };
                meta.dataUrl = getTranformedUrl(data, meta)
                results.push(meta)
            }
            callback(null, results)
        }
    })
}

function getDataFromImageUrl(url, callback) {
    var request = require('request').defaults({ encoding: null });    
    request.get(url, function (error, response, body) {
        if(error) {
            callback(error, null)
        }
        else if (body && response.statusCode == 200) {
            var info = {
                body: body,
                size: response.headers['content-length']s
            }
            callback(null, info)
        }
        else {
            callback("no body available", null)
        }
    });
}

function updateStickerDbForMiniImageUpload(info, callback) {
    var images = info.images;
    var sticker = info.sticker;

    async.parallel({
        updateLegacySticker: (callback) => {
            LegacySticker.update({sId: sticker.lsid, catId: sticker.lcid}, {$set: {'img_avail.stmn': true}}, (error, response) => {
                if(error) {
                    callback(error, null)
                }
                else {
                    callback(null, 'done')
                }
            })
        },
        updateSticker: (callback) => {
            // to-do implemnt gcsPath update
            Sticker.update({stickerId: sticker.stickerId}, {$set: {'images.mini': sticker.images.mini}}, (error, response) => {
                if(error) {
                    callback(error, null)
                }
                else {
                    callback(null, 'done')
                }
            })
        }
    }, (error, values) => {
        if(error) {
            callback(error, null)
        }
        else {
            callback(null, 'done')
        }
    })
}

function uploadImagesOnGcs(info, callback) {
    var sticker = info.sticker;
    var images = info.images;
    async.eachSeries(images, (image, callback) => {
        getDataFromImageUrl(image.dataUrl, (error, imageData) => {
            if(error) {
                callback(error, null)
            }
            else {
                // var contentType = imageType(imageData)
                async.parallel({
                    legacyStickerUpload: (callback) => {
                        var bucket = gcsStorage.bucket(constants.legacy_gcs_bucket);
                        var filepath = "stk_mini_"+image.resType.toUpperCase()+'_'+sticker.lcid+'/'+sticker.lsid
                        var file = bucket.file(filepath);
                        var legacyImageData = imageData.body.toString("base64")
                        file.save(legacyImageData, {
                            metadata: { contentType: "image/png"}
                        }, function(error) {
                            if (error) {
                                callback(error, null)
                            }
                            else {
                                image.legacyGcsPath = filepath
                                callback(null, filepath)
                            }
                        });
                    },
                    stickerUpload: (callback) => {
                        var bucket = gcsStorage.bucket(constants.gcs_bucket);
                        var filepath = "stickers/"+sticker.stickerId+"/mini/"+image.resType.toUpperCase()+'.png'
                        var file = bucket.file(filepath);
                        var imageBuffer = new Buffer(imageData.body)
                        file.save(imageBuffer, {
                            metadata: { contentType: "image/png"}
                        }, function(error) {
                            if (error) {
                                callback(error, null)
                            }
                            else {
                                sticker.images.mini[image.resType]["gcsPath"] = filepath
                                sticker.images.mini[image.resType]["width"] = image.width
                                sticker.images.mini[image.resType]["height"] = image.height
                                sticker.images.mini[image.resType]["size"] = imageData.size
                                // sticker.images.mini[image.resType]["cloudinaryPath"] = filepath
                                callback(null, filepath)
                            }
                        });
                    }
                }, (error, values) => {
                    if(error) {
                        callback(error, null)
                    }
                    else {
                        callback(null, values)
                    }
                })
            }
        })
    }, function(error) {
        if(error) {
            callback(error, null)
        }
        else {
            var updateInfo = {
                images: images,
                sticker: sticker
            }
            console.log(updateInfo)
            // updateStickerDbForMiniImageUpload(updateInfo, (error, dbResponse) => {
            //     if(error) {
            //         console.log(error)
            //     }
            //     callback(null, dbResponse)
            // })
        }
    })
}

function runScript(catIds) {
    getImagePaths(catIds, (error, fileData) => {
        if(error) {
            console.log(error)
        }
        else {
            async.eachSeries(fileData, (data, callback) => {
                console.log("Processing Image for catId : "+data.catId + " and sId : "+ data.sId)
                async.waterfall([
                    (callback) => {
                        getSticker(data, (error, value) => {
                            if(error) {
                                callback(error, null)
                            }
                            else {
                                callback(null, fileMeta, sticker)
                            }
                        })
                    },
                    (fileMeta, sticker, callback) => {
                        var imageInfo = {
                            fileMeta: fileMeta,
                            sticker: sticker                            
                        }
                        uploadOnCloudinary(imageInfo, (error, cloudinaryResponse) => {
                            if(error) {
                                callback(error, null)
                            }
                            else {
                                callback(null, cloudinaryResponse, sticker)
                            }
                        })
                    },
                    (cloudinaryResponse, sticker, callback) => {
                        getImageMetaForAllResolution(cloudinaryResponse, (error, imagesResMeta) => {
                            if(error) {
                                callback(error, null)
                            }
                            else {
                                callback(null, imagesResMeta, sticker)
                            }
                        })
                    },
                    (imagesResMeta, sticker, callback) => {
                        var uploadInfo = {
                            sticker: sticker,
                            images: imagesResMeta
                        }
                        uploadImagesOnGcs(uploadInfo, (error, response) => {
                            if(error) {
                                callback(error, null)
                            }
                            else {
                                callback(null, 'done')
                            }
                        })
                    }
                ], (error, result) => {
                    if(error) {
                        callback(error)
                    }
                    else {
                        console.log("Update finsihed for catId: "+data.catId + " sid: "+data.sId + " stickerId : "+ data.stickerId )
                        callback()
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
var lcids = ["poofy"]
// runScript(lcids)