var fs                      = require('fs')
    , path                  = require('path')
    , async                 = require('async')
    , cloudinary            = require('cloudinary')
    , config                = require('config')
    , NeDb                  = require('nedb')

var db                      = require('./db/mongo');
var LegacyDb                = new NeDb({filename: path.join(__dirname, "..", "legacyIds.db"), autoload: true})

var mongoose 				= require('mongoose')
    , ObjectId 				= mongoose.Types.ObjectId
    , Sticker   			= mongoose.model('Sticker')
    , LegacySticker         = mongoose.model('LegacySticker')

var gcs_config = {
    projectId: config.get('gcs.projectId'),
    keyFilename: path.join(__dirname, "..", "gcs_key.json")
};
var gcsStorage = require('@google-cloud/storage')(gcs_config);

cloudinary.config(config.get('cloudinary'));

function updateNedbLegacy() {
    LegacySticker.find({}, function(error, legacyStickers) {
        if(error) {
            callback(error, null)
        }
        else {
            var legacyIds = [];
            for(var i=0; i<legacyStickers.length; i++) {
                var legacySticker = legacyStickers[i]
                if(legacySticker.catId && legacySticker.sId && legacySticker.img_avail && legacySticker.img_avail.st 
                    && legacySticker.img_avail.an == false) {
                    var info = {
                        lcid: legacySticker.catId,
                        lsid: legacySticker.sId,
                        error: false,
                        errorVal: null
                    }
                    legacyIds.push(info)
                }
            }
            LegacyDb.insert(legacyIds, function(error, vals) {
                if(error) {
                    console.log(error)
                }
                else {
                    LegacyDb.ensureIndex({ fieldName: "error" }, function (err) {
                        if(err) {
                            console.log(err)
                        }
                    });
                    console.log("Nedb Updated")
                }
            })
        }
    })
}

// updateNedbLegacy()

var factor = 5;
var limit = 2000;
function getLegacyIdsFromNedb(callback) {
    LegacyDb.find({error: true, errorVal: "not exists in new world"}).skip(factor*limit).limit(limit).exec(function(error, val) {
        if(error) {
            callback(error, null)
        }
        else {
		console.log(val[0])
            callback(null, val)
        }
    })
}

function getOriginalImageUrl(sticker, callback) {
    //var dropboxImgPath;
    //if(sticker.lcid && sticker.lsid) {
    //    dropboxImgPath = path.join(config.get("imageFolder.dropbox"), "2_Stickers", "1_Source files","Or_SticPNG", sticker.lcid, sticker.lsid)
    //}
    //fs.stat(dropboxImgPath, (error, stat) => {
     //   if(stat) {
     //       callback(null, dropboxImgPath)
     //   }
     //   else {
            if(sticker.images && sticker.images.staticRegular && sticker.images.staticRegular.XXHDPI 
                && sticker.images.staticRegular.XXHDPI.gcsPath) {
                    var imageUrl = config.get('gcs.urlPrefix') +  "/" + sticker.images.staticRegular.XXHDPI.gcsPath;
                    if (imageUrl.indexOf(".png") < 0) {
                        imageUrl = imageUrl + '.png'
                    }
		    console.log(imageUrl)
                    callback(null, imageUrl)
            }
            else {
                callback("No Image Data available", null)
            }
        //}
    //})
}

function uploadOnCloudinary(originalImageUrl, sticker, callback) {
    var options = {
        folder: config.get('imageFolder.cloudinaryOrgImgFolder')+ '/staticRegular/' + sticker.stickerId,
        public_id: "original",
        effect: "trim"
    }
    cloudinary.v2.uploader.upload(originalImageUrl, options, (error, result) => {
        if(error) {
            callback(error, null)
        }
        else {
            callback(null, result)
        }
    })
}

function getTranformedUrl(uploadResult, transformation) {
    var transformedUrl = cloudinary.url(uploadResult.public_id, {sign_url: true, 
        version: uploadResult.version, width: transformation.width, height: transformation.height, crop: 'scale', 
        quality: "auto:eco", format: 'png'});
    return transformedUrl
}

function getImageMetaForAllResolution(uploadResult, callback) {
    var resFactor = config.get("resFactor");
    var imageMeta = {
        regular: [],
        mini: []
    }
    var base_width = uploadResult.width;
    var base_height = uploadResult.height;
    for (key in resFactor.sticker) {
        var mini_meta = {
            "resType" : key,
            "width": Math.round(base_width * resFactor.miniSticker),
            "height": Math.round(base_height * resFactor.miniSticker)
        };
        mini_meta.imageUrl = getTranformedUrl(uploadResult, mini_meta)
        var regularMeta = {
            "resType" : key,
            "width": Math.round(base_width * resFactor.sticker[key]),
            "height": Math.round(base_height * resFactor.sticker[key])
        }
        regularMeta.imageUrl = getTranformedUrl(uploadResult, regularMeta)
        imageMeta.regular.push(regularMeta)
        imageMeta.mini.push(mini_meta)
    }
    callback(null, imageMeta)
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
                size: response.headers['content-length']
            }
            callback(null, info)
        }
        else {
            callback("no body available", null)
        }
    });
}

function updateGcsBucket(imageInfo, sticker, stickerType, callback) {
    var legacyPrefix = "stk_"
    var prefix = "staticRegular"
    if(stickerType == 'mini') {
        legacyPrefix = "stk_mini_"
        prefix = "mini"
    }
    async.parallel({
        legacyStickerPath: (callback) => {
            var bucket = gcsStorage.bucket(config.get("gcs.legacyBucket"));
            var filepath = legacyPrefix+imageInfo.resType.toUpperCase()+'_'+sticker.lcid+'/'+sticker.lsid
            var file = bucket.file(filepath);
            var legacyImageData = imageInfo.body.toString("base64")
            file.save(legacyImageData, {
                metadata: { 
                    contentType: "image/png",
                    cacheControl: 'public, max-age=3600'
                }
            }, function(error) {
                if (error) {
                    callback(error, null)
                }
                else {
                    callback(null, filepath)
                }
            });
        },
        stickerPath: (callback) => {
            var bucket = gcsStorage.bucket(config.get('gcs.bucket'));
            var filepath = "stickers/"+sticker.stickerId+"/"+prefix+"/"+imageInfo.resType.toUpperCase()+'.png'
            var file = bucket.file(filepath);
            var imageBuffer = new Buffer(imageInfo.body)
            file.save(imageBuffer, {
                metadata: { 
                    contentType: "image/png",
                    cacheControl: 'public, max-age=3600'
                }
            }, function(error) {
                if (error) {
                    callback(error, null)
                }
                else {
                    callback(null, filepath)
                }
            });
        }
    }, (error, values) => {
        if(error) {
            callback(error, null)
        }
        else {
            callback(null, values.stickerPath)
        }
    })
}

function uploadImagesOnGcs(imageData, sticker, callback) {
    var updateImageMeta = {
        staticRegular:  sticker.images.staticRegular,
        mini: sticker.images.mini
    }

    async.parallel({
        regular: (callback) => {
            async.eachSeries(imageData.regular, (regularMeta, callback)=> {
                getDataFromImageUrl(regularMeta.imageUrl, (error, imageResp) => {
                    if(error) {
                        callback(error, null)
                    }
                    else {
                        var info = {
                            body: imageResp.body,
                            resType: regularMeta.resType
                        }
                        updateGcsBucket(info, sticker, "regular", (error, filePath) => {
                            if(error) {
                                callback(error, null)
                            }
                            else {
                                updateImageMeta.staticRegular[regularMeta.resType]["gcsPath"] = filePath
                                updateImageMeta.staticRegular[regularMeta.resType]["width"] = regularMeta.width
                                updateImageMeta.staticRegular[regularMeta.resType]["height"] = regularMeta.height
                                updateImageMeta.staticRegular[regularMeta.resType]["size"] = imageResp.size
                                callback(null, null)
                            }
                        })
                    }
                })
            }, (error) => {
                if(error) {
                    callback(error, null)
                }
                else {
                    callback(null, null)
                }
            })
        },
        mini: (callback) => {
            async.eachSeries(imageData.mini, (miniMeta, callback)=> {
                getDataFromImageUrl(miniMeta.imageUrl, (error, imageResp) => {
                    if(error) {
                        callback(error, null)
                    }
                    else {
                        var info = {
                            body: imageResp.body,
                            resType: miniMeta.resType
                        }
                        updateGcsBucket(info, sticker, "mini", (error, filePath) => {
                            if(error) {
                                callback(error, null)
                            }
                            else {
                                updateImageMeta.mini[miniMeta.resType]["gcsPath"] = filePath
                                updateImageMeta.mini[miniMeta.resType]["width"] = miniMeta.width
                                updateImageMeta.mini[miniMeta.resType]["height"] = miniMeta.height
                                updateImageMeta.mini[miniMeta.resType]["size"] = imageResp.size
                                callback(null, null)
                            }
                        })
                    }
                })
            }, (error) => {
                if(error) {
                    callback(error, null)
                }
                else {
                    callback(null, null)
                }
            })
        }
    }, (error, results) => {
        if(error) {
            callback(error, null)
        }
        else {
            callback(null, updateImageMeta)
        }
    })
}

function updateStickerDb(updateInfo, sticker, callback) {
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
            Sticker.update({stickerId: sticker.stickerId}, {$set: {'images': updateInfo}}, (error, response) => {
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

function script() {
    getLegacyIdsFromNedb((error, legacyIds) => {
        if(error) {
            console.log(error)
        }
        else {
            console.log("Total Legacy Ids: "+ legacyIds.length)
            var currentCount = 1
            async.eachSeries(legacyIds, (legacyId, callback) => {
                console.log("Processing lcid : "+ legacyId.lcid + " and lsid : "+ legacyId.lsid + " current count : "+currentCount)
                currentCount += 1;
                Sticker.findOne({lcid: legacyId.lcid, lsid: legacyId.lsid}, function(error, sticker) {
                    if(error) {
                        LegacyDb.update({_id: legacyId._id}, {$set: {error: true, errorVal: "not exists in new world"}}, function(error, val) {
                            console.log("Error for lcid: "+legacyId.lcid + " lsid: "+ legacyId.lsid + " not exists in new world", );
                            callback()
                        })
                    }
                    else if(sticker) {
                        async.waterfall([
                            (callback) => {
                                getOriginalImageUrl(sticker, function(error, originalImageUrl) {
                                    if(error) {
                                        callback(error, null)
                                    }
                                    else {
                                        callback(null, originalImageUrl)
                                    }
                                })
                            },
                            (originalImageUrl, callback) => {
                                uploadOnCloudinary(originalImageUrl, sticker, (error, uploadResult) => {
                                    if(error) {
                                        callback(error, null)
                                    }
                                    else {
                                        callback(null, uploadResult)
                                    }
                                })
                            },
                            (uploadResult, callback) => {
                                getImageMetaForAllResolution(uploadResult, (error, imageData) => {
                                    if(error) {
                                        callback(error, null)
                                    }
                                    else {
                                        callback(null, imageData)
                                    }
                                })
                            },
                            (imageData, callback) => {
                                uploadImagesOnGcs(imageData, sticker, (error, imageMeta) => {
                                    if(error) {
                                        callback(error, null)
                                    }
                                    else {
                                        callback(null, imageMeta)
                                    }
                                })
                            },
                            (imageMeta, callback) => {
                                updateStickerDb(imageMeta, sticker, (error, response) => {
                                    if(error) {
                                        callback(error, null)
                                    }
                                    else {
                                        callback(null, response)
                                    }
                                })
                            }
                        ], (error, result) => {
                            if(error) {
                                LegacyDb.update({_id: legacyId._id}, {$set: {error: true, errorVal: error.toString()}}, function(error, val) {
                                    console.log("Error for lcid: "+sticker.lcid + " lsid: "+ sticker.lsid + " with error", error);
                                    callback()
                                })
                            }
                            else {
                                LegacyDb.remove({_id: legacyId._id}, function(error, val) {
                                    console.log("Update finsihed for lcid: "+sticker.lcid + " lsid: "+sticker.lsid + " stickerId : "+  sticker.stickerId);
                                    callback()
                                })
                            }
                        })
                    }
                    else {
                        LegacyDb.update({_id: legacyId._id}, {$set: {error: true, errorVal: "not found in db"}}, function(error, val) {
                            console.log("Error for lcid: "+legacyId.lcid + " lsid: "+ legacyId.lsid + " not found in db", );
                            callback()
                        })
                    }
                })
            }, (error) => {
                if(error) {
                    console.log(error)
                }
                console.log("Finished Migration")
            })
        }
    })
}

script()
