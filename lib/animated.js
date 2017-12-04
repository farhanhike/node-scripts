var fs                      = require('fs')
    , path                  = require('path')
    , async                 = require('async')
    , cloudinary            = require('cloudinary')

var db                      = require('./db/mongo');
    
var mongoose 				= require('mongoose')
    , ObjectId 				= mongoose.Types.ObjectId
    , Sticker   			= mongoose.model('Sticker')
    , LegacySticker         = mongoose.model('LegacySticker')

var config_path = path.join(process.env.CONFIG_FOLDER, "node-scripts")
var config = require(path.join(config_path,"properties"))

var constants = {
    gcs_key: path.join(config_path,"gcs_key.json"),
    dropbox_path: config.imagePath.dropbox,
    project_id: config.gcs.project_id,
    legacy_gcs_bucket: config.gcs.legacy_bucket,
    gcs_bucket: config.gcs.bucket,
    gcsUrlPrefix: config.gcs.urlPrefix,
    cloudinaryUploadFolder: config.imagePath.cloudinaryOrgImgFolder
}

var gcs_config = {
    projectId: constants.project_id,
    keyFilename: constants.gcs_key
};

var gcsStorage = require('@google-cloud/storage')(gcs_config);
cloudinary.config(config.cloudinary)

var res_factor = {'HDPI':0.4888888889, 'LDPI':0.2222222222, 'MDPI':0.2888888889, 'XHDPI':0.6537037037, 'XXHDPI':1}
var mini_res_factor = 0.359259593

function getLegacyIds(callback) {
    // var legacyIds = require("./../legacyIds.json")
    // callback(null, legacyIds);
    LegacySticker.find({}, function(error, legacyStickers) {
        if(error) {
            callback(error, null)
        }
        else {
            var legacyIds = [];
            for(var i=0; i<legacyStickers.length; i++) {
                var legacySticker = legacyStickers[i]
                if(legacySticker.catId && legacySticker.sId && legacySticker.img_avail && legacySticker.img_avail.an) {
                    var info = {
                        lcid: legacySticker.catId,
                        lsid: legacySticker.sId
                    }
                    legacyIds.push(info)
                }
            }
            callback(null, legacyIds)
        }
    })
}

function getOriginalImageUrl(sticker, callback) {
    var dropboxImgPath;
    if(sticker.lcid && sticker.lsid) {
        dropboxImgPath = path.join(constants.dropbox_path, "2_Stickers", "1_Source files","Or_SticANIM", sticker.lcid, sticker.lsid)
    }
    fs.stat(dropboxImgPath, (error, stat) => {
        if(stat) {
            callback(null, dropboxImgPath)
        }
        else {
            if(sticker.images && sticker.images.animRegular && sticker.images.animRegular.XXHDPI 
                && sticker.images.animRegular.XXHDPI.gcsPath) {
                    var imageUrl = constants.gcsUrlPrefix +  "/" + sticker.images.animRegular.XXHDPI.gcsPath;
                    callback(null, imageUrl)
            }
            else {
                callback("No Image Data available", null)
            }
        }
    })
}

function uploadOnCloudinary(originalImageUrl, sticker, callback) {
    var options = {
        folder: constants.cloudinaryUploadFolder + '/animRegular/' + sticker.stickerId,
        public_id: "original"
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

function getTranformedUrl(uploadResult, transformation, format) {
    var transformedUrl = cloudinary.url(uploadResult.public_id, {sign_url: true, 
        version: uploadResult.version, width: transformation.width, height: transformation.height, crop: 'scale', 
        quality: "auto:eco", format: format});
    return transformedUrl
}

function getImageMetaForAllResolution(uploadResult, callback) {
    var imageMeta = {
        animRegular: [],
        staticRegular: [],
        mini: []
    }
    var base_width = uploadResult.width;
    var base_height = uploadResult.height;
    for (key in res_factor) {
        var anim_meta = {
            "resType" : key,
            "width": Math.round(base_width*res_factor[key]),
            "height": Math.round(base_height*res_factor[key])
        }
        anim_meta.imageUrl = getTranformedUrl(uploadResult, anim_meta, "gif")
        imageMeta.animRegular.push(anim_meta)
        var static_meta = {
            "resType" : key,
            "width": Math.round(base_width*res_factor[key]),
            "height": Math.round(base_height*res_factor[key])
        }
        static_meta.imageUrl = getTranformedUrl(uploadResult, static_meta, "png")
        imageMeta.staticRegular.push(static_meta)
        
        var mini_meta = {
            "resType" : key,
            "width": Math.round(base_width*mini_res_factor),
            "height": Math.round(base_height*mini_res_factor)
        };
        mini_meta.imageUrl = getTranformedUrl(uploadResult, mini_meta, "png")
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

function updateGcsBucket(imageInfo, sticker, prefix, callback) {
    var legacyPrefix = "stk_"
    var imageFormat = ".png"
    if(prefix == 'mini') {
        legacyPrefix = "stk_mini_"
        imageFormat = ".png"
    }
    else if (prefix == 'animRegular') {
        legacyPrefix = "stk_anim_"
        imageFormat = ".gif"
    }
    async.parallel({
        legacyStickerPath: (callback) => {
            var legacyStickerId = sticker.lsid;
            var bucket = gcsStorage.bucket(constants.legacy_gcs_bucket);
            var filepath = legacyPrefix+imageInfo.resType.toUpperCase()+'_'+sticker.lcid+'/'+ sticker.lsid
            var file = bucket.file(filepath);
            var legacyImageData = imageInfo.body.toString("base64")
            file.save(legacyImageData, {
                metadata: { contentType: "image/png"}
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
            var bucket = gcsStorage.bucket(constants.gcs_bucket);
            var filepath = "stickers/"+sticker.stickerId+"/"+prefix+"/"+imageInfo.resType.toUpperCase()+imageFormat
            var file = bucket.file(filepath);
            var imageBuffer = new Buffer(imageInfo.body)
            file.save(imageBuffer, {
                metadata: { contentType: "image/png"}
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
        mini: sticker.images.mini,
        animRegular: sticker.images.animRegular
    }

    async.parallel({
        animRegular: (callback) => {
            async.eachSeries(imageData.animRegular, (animRegularMeta, callback)=> {
                getDataFromImageUrl(animRegularMeta.imageUrl, (error, imageResp) => {
                    if(error) {
                        callback(error, null)
                    }
                    else {
                        var info = {
                            body: imageResp.body,
                            resType: animRegularMeta.resType
                        }
                        updateGcsBucket(info, sticker, "animRegular", (error, filePath) => {
                            if(error) {
                                callback(error, null)
                            }
                            else {
                                updateImageMeta.animRegular[animRegularMeta.resType]["gcsPath"] = filePath
                                updateImageMeta.animRegular[animRegularMeta.resType]["width"] = animRegularMeta.width
                                updateImageMeta.animRegular[animRegularMeta.resType]["height"] = animRegularMeta.height
                                updateImageMeta.animRegular[animRegularMeta.resType]["size"] = imageResp.size
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
        staticRegular: (callback) => {
            async.eachSeries(imageData.staticRegular, (staticRegularMeta, callback)=> {
                getDataFromImageUrl(staticRegularMeta.imageUrl, (error, imageResp) => {
                    if(error) {
                        callback(error, null)
                    }
                    else {
                        var info = {
                            body: imageResp.body,
                            resType: staticRegularMeta.resType
                        }
                        updateGcsBucket(info, sticker, "staticRegular", (error, filePath) => {
                            if(error) {
                                callback(error, null)
                            }
                            else {
                                updateImageMeta.staticRegular[staticRegularMeta.resType]["gcsPath"] = filePath
                                updateImageMeta.staticRegular[staticRegularMeta.resType]["width"] = staticRegularMeta.width
                                updateImageMeta.staticRegular[staticRegularMeta.resType]["height"] = staticRegularMeta.height
                                updateImageMeta.staticRegular[staticRegularMeta.resType]["size"] = imageResp.size
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
            LegacySticker.update({sId: sticker.lsid, catId: sticker.lcid}, {$set: {'img_avail.stmn': true, 'img_avail.st': true}}, (error, response) => {
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
    getLegacyIds((error, legacyIds) => {
        if(error) {
            console.log(error)
        }
        else {
            console.log(legacyIds)
            console.log("Total Legacy Ids: "+ legacyIds.length)
            var currentCount = 1
            async.eachLimit(legacyIds, 1, (legacyId, callback) => {
                console.log("Processing lcid : "+ legacyId.lcid + " and lsid : "+ legacyId.lsid + " current count : "+currentCount)
                currentCount += 1;
                Sticker.findOne({lcid: legacyId.lcid, lsid: legacyId.lsid}, function(error, sticker) {
                    if(error) {
                        console.log("Error for lcid: "+legacyId.lcid + " lsid: "+ legacyId.lsid + " in db query", );
                        callback()
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
                                console.log("Error for lcid: "+sticker.lcid + " lsid: "+ sticker.lsid + " with error", error);
                            }
                            else {
                                console.log("Update finsihed for lcid: "+sticker.lcid + " lsid: "+sticker.lsid + " stickerId : "+  sticker.stickerId);
                            }
                            callback()
                        })
                    }
                    else {
                        console.log("Error for lcid: "+legacyId.lcid + " lsid: "+ legacyId.lsid + " not found in db");
                        callback()
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

// script()