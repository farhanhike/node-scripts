'use strict';

const fs = require('fs')
    , path = require('path')
    , async = require('async')
    , config = require('config')
    , NeDb = require('nedb');

const cloudinaryClient = require('./cloudinary')
    , imageClient = require('./image')
    , gcsClient = require('./gcs');

const db = require('../db/mongo');

const mongoose = require('mongoose')
    , ObjectId = mongoose.Types.ObjectId
    , Sticker = mongoose.model('Sticker')
    , LegacySticker = mongoose.model('LegacySticker')

function isAnimatedSticker(sticker) {
    if(sticker.images && sticker.images.animRegular && sticker.images.animRegular.XXHDPI && sticker.images.animRegular.XXHDPI.gcsPath) {
        return true
    }
    else {
        return false
    }
}

function getStickers(query, limit, callback) {
    let sticker =  Sticker.find(query)
    if(limit) {
        sticker = sticker.limit(limit)
    }
    sticker.exec((error, stickers) => {
        if(error) {
            callback(error, null);
        }
        else {
            callback(null, stickers);
        }
    })
}

function getOriginalImageUrl(sticker, isAnimated,  callback) {
    var dropboxImgPath;
    if (sticker.lcid && sticker.lsid) {
        if(isAnimated) {
            dropboxImgPath = path.join(config.get("imageFolder.dropbox"), "2_Stickers", "1_Source files", "Or_SticANIM", sticker.lcid, sticker.lsid)
        }
        else {
            dropboxImgPath = path.join(config.get("imageFolder.dropbox"), "2_Stickers", "1_Source files", "Or_SticPNG", sticker.lcid, sticker.lsid)
        }
    }
    fs.stat(dropboxImgPath, (error, stat) => {
        if (stat) {
            callback(null, dropboxImgPath)
        }
        else {
            if(isAnimated) {
                if (sticker.images && sticker.images.animRegular && sticker.images.animRegular.XXHDPI
                    && sticker.images.animRegular.XXHDPI.gcsPath) {
                    const gcsUrl = config.get('gcs.urlPrefix') + "/" + sticker.images.animRegular.XXHDPI.gcsPath;
                    callback(null, gcsUrl)
                }
                else {
                    callback("Gcs ImageUrl Not available Nor Dropbox path", null)
                }
            }
            else {
                if (sticker.images && sticker.images.staticRegular && sticker.images.staticRegular.XXHDPI
                    && sticker.images.staticRegular.XXHDPI.gcsPath) {
                    const gcsUrl = config.get('gcs.urlPrefix') + "/" + sticker.images.staticRegular.XXHDPI.gcsPath;
                    callback(null, gcsUrl)
                }
                else {
                    callback("Gcs ImageUrl Not available Nor Dropbox path", null)
                }
            }
        }
    })
}

function uploadOnCloudinary(baseImageUrl, stickerId, isAnimated, callback) {
    let folderPath = config.get('imageFolder.cloudinaryOrgImgFolder') + '/staticRegular/' + stickerId
    if (isAnimated) {
        folderPath = config.get('imageFolder.cloudinaryOrgImgFolder') + '/animRegular/' + stickerId
    }
    var options = {
        folder: folderPath,
        public_id: "original"
    }
    if (!isAnimated) {
        options['effect'] = "trim"
    }
    cloudinaryClient.upload(baseImageUrl, options, (error, result) => {
        if (error) {
            callback(`Cloudinary Upload Error : ${error.toString()}`, null)
        }
        else {
            callback(null, result)
        }
    })
}

function populateImageMetaAndSize(uploadResult, isAnimated, callback) {
    let images = imageClient.getImageMetaForAllResolution(uploadResult, isAnimated)
    async.eachSeries(images, (image, callback) => {
        imageClient.getDataAndSize(image.url, (error, response) => {
            if (error) {
                callback(`Unable to get image bytes for : ${error.toString()}`, null)
            } else {
                image.data = response.body;
                image.size = response.size;
                callback()
            }
        })
    }, (error) => {
        if (error) {
            callback(error, null)
        }
        else {
            callback(null, images)
        }
    })
}

function uploadOnGcs(imageInfo, sticker, callback) {
    const legacyBucketName = config.get("gcs.legacyBucket");
    const bucketName = config.get("gcs.bucket");
    
    async.eachSeries(imageInfo, (image, callback) => {
        let gcsMetaData = {
            contentType: "image/png",
            cacheControl: 'public, max-age=3600'
        }
        if(imageInfo.type == 'animRegular') {
            gcsMetaData = {
                contentType: "image/gif",
                cacheControl: 'public, max-age=3600'
            }
        }

        async.parallel({
            legacyBucketUpdate: (callback) => {
                const filepath = gcsClient.generateLegacyGcsPath(sticker, image)
                const base64Data = image.data.toString("base64")
                gcsClient.upload(legacyBucketName, filepath, base64Data, gcsMetaData, (error, response) => {
                    if(error) {
                        callback(`Error in uploading legacyImage ${error.toString()}`, null)
                    }
                    else {
                        callback(null, response)
                    }
                })
            },
            bucketUpdate: (callback) => {
                const filepath = gcsClient.generateGcsPath(sticker, image)
                const imageBuffer = new Buffer(image.data)
                gcsClient.upload(bucketName, filepath, imageBuffer, gcsMetaData, (error, response) => {
                    if(error) {
                        callback(`Error in uploading image ${error.toString()}`, null)
                    }
                    else {
                        callback(null, response)
                    }
                })
            }
        }, (error, values) => {
            if (error) {
                callback(error)
            }
            else {
                delete image.data
                image.gcsPath = values.bucketUpdate
                callback()
            }
        })
    }, (error) => {
        if(error) {
            callback(error, null)
        }
        else {
            callback(null, imageInfo)
        }
    })
}

function updateStickerDb(imageData, sticker, isAnimated, callback) {
    async.parallel({
        updateLegacySticker: (callback) => {
            var setData = { 'img_avail.stmn': true, 'img_avail.st': true };
            if(isAnimated) {
                setData['img_avail.an'] = true
            }
            LegacySticker.update({ sId: sticker.lsid, catId: sticker.lcid }, { $set:  setData}, (error, response) => {
                if (error) {
                    callback(`Error in legacy sticker dbUpdate ${error.toString}`, null)
                }
                else {
                    callback(null, 'done')
                }
            })
        },
        updateSticker: (callback) => {
            let info = {
                staticRegular: sticker.images.staticRegular,
                mini: sticker.images.mini,
            };
            
            if(isAnimated) {
                info['animRegular'] = sticker.images.animRegular
            }

            for (let i=0; i<imageData.length; i++) {
                info[imageData[i].type][imageData[i].resType]["gcsPath"] = imageData[i].gcsPath
                info[imageData[i].type][imageData[i].resType]["width"] = imageData[i].width
                info[imageData[i].type][imageData[i].resType]["height"] = imageData[i].height
                info[imageData[i].type][imageData[i].resType]["size"] = imageData[i].size
            }
            Sticker.update({ stickerId: sticker.stickerId }, { $set: { 'images': info } }, (error, response) => {
                if (error) {
                    callback(`Error in sticker dbUpdate ${error.toString}`, null)
                }
                else {
                    callback(null, 'done')
                }
            })
        }
    }, (error, values) => {
        if (error) {
            callback(error, null)
        }
        else {
            callback(null, 'done')
        }
    })
}

function getBaseUrlAndType(sticker, callback) {
    const isAnimated = isAnimatedSticker(sticker);
    getOriginalImageUrl(sticker, isAnimated, (error, response) => {
        if(error) {
            callback(error, null)
        } else {
            const info = {
                isAnimated : isAnimated,
                baseUrl: response
            }
            callback(null, info)
        }
    })
}

function update(sticker, isAnimated, baseUrl, callback) {
    async.waterfall([
        // Upload On cloudinary
        (callback) => {
            uploadOnCloudinary(baseUrl, sticker.stickerId, isAnimated, (error, response) => {
                if (error) {
                    callback(error, null)
                } else {
                    callback(null, response)
                }
            })
        },
        // get image data and meta
        (uploadResult, callback) => {
            populateImageMetaAndSize(uploadResult, isAnimated, (error, response) => {
                if (error) {
                    callback(error, null)
                }
                else {
                    callback(null, response)
                }
            })
        },
        // upload images each Images on gcs 
        (imageResMeta, callback) => {
            uploadOnGcs(imageResMeta, sticker, (error, response) => {
                if (error) {
                    callback(error, null)
                } else {
                    callback(null, imageResMeta)
                }
            })
        },
        // updata sticker Db
        (imageResMeta, callback) => {
            updateStickerDb(imageResMeta, sticker, isAnimated,  (error, response) => {
                if(error) {
                    callback(error, null)
                }
                else {
                    callback(null, response)
                }
            })
        }
    ], (error, result) => {
        if (error) {
            return callback(error, null)
        }
        else {
            return callback(null, result)
        }
    })
}

module.exports = {
    getBaseUrlAndType: getBaseUrlAndType,
    update: update,
    getStickers: getStickers
}