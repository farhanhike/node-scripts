const cloudinaryClient  = require('./cloudinary');
const config            = require('config');

function getImageMetaForAllResolution(uploadResult, isAnimated) {
    const resFactor = config.get("resFactor");
    const base_width = uploadResult.width;
    const base_height = uploadResult.height;
    let imageMeta = []
    for (key in resFactor.sticker) {
        if (isAnimated) {
            let animMeta = {
                "resType": key,
                "width": Math.round(base_width * resFactor.sticker[key]),
                "height": Math.round(base_height * resFactor.sticker[key]),
                "type": "animRegular"
            }
            animMeta.url = cloudinaryClient.getTranformedUrl(uploadResult, animMeta, "gif")
            imageMeta.push(animMeta)
        }
        var staticMeta = {
            "resType": key,
            "width": Math.round(base_width * resFactor.sticker[key]),
            "height": Math.round(base_height * resFactor.sticker[key]),
            "type": "staticRegular"
        }
        staticMeta.url = cloudinaryClient.getTranformedUrl(uploadResult, staticMeta, "png")
        imageMeta.push(staticMeta)

        var miniMeta = {
            "resType": key,
            "width": Math.round(base_width * resFactor.miniSticker),
            "height": Math.round(base_height * resFactor.miniSticker),
            "type": "mini"
        };
        miniMeta.url = cloudinaryClient.getTranformedUrl(uploadResult, miniMeta, "png")
        imageMeta.push(miniMeta)
    }
    return imageMeta;
}

function getDataAndSize(url, callback) {
    const request = require('request').defaults({ encoding: null });
    request.get(url, function (error, response, body) {
        if (error) {
            callback(error, null)
        }
        else if (body && response.statusCode == 200) {
            let info = {
                body: body,
                size: response.headers['content-length']
            }
            callback(null, info)
        }
        else {
            callback("no body available in response", null)
        }
    });
}

module.exports = {
    getImageMetaForAllResolution: getImageMetaForAllResolution,
    getDataAndSize: getDataAndSize
}