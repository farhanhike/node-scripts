'use strict';

const cloudinary    = require('cloudinary');
const config        = require('config');

cloudinary.config(config.get('cloudinary'));

function upload(imageUrl, options, callback) {
    cloudinary.v2.uploader.upload(imageUrl, options, (error, result) => {
        if (error) {
            callback(error, null)
        }
        else {
            callback(null, result)
        }
    })
}

function getTranformedUrl(uploadResult, transformation, format) {
    var transformedUrl = cloudinary.url(uploadResult.public_id, {
        sign_url: true,
        version: uploadResult.version, width: transformation.width, height: transformation.height, crop: 'scale',
        quality: "auto:eco", format: format
    });
    return transformedUrl
}

module.exports = {
    upload: upload,
    getTranformedUrl: getTranformedUrl
}