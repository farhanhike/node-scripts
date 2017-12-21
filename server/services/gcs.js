const config    = require('config')
const path      = require('path')

const gcs_config = {
    projectId: config.get('gcs.projectId'),
    keyFilename: path.join(__dirname, "..", "..", "gcs_key.json")
};
const gcsStorage = require('@google-cloud/storage')(gcs_config);
 
function upload(bucketName, path, data, md, callback) {
    const bucket = gcsStorage.bucket(bucketName);
    const meta = (md == null ) ? {} : md;
    let file = bucket.file(path);
    file.save(data, {
        metadata: {
            contentType: meta.contentType || "image/png",
            cacheControl: meta.cacheControl || "public, max-age=3600"
        }
    }, function (error) {
        if (error) {
            callback(error, null)
        }
        else {
            callback(null, path)
        }
    });
}

function generateLegacyGcsPath(sticker, imageMeta) {
    const pathPrefix = config.get('gcs.legacyPathPrefix')
    const filePath = pathPrefix[imageMeta.type]+imageMeta.resType.toUpperCase()+'_'+sticker.lcid+'/'+ sticker.lsid
    return filePath
}

function generateGcsPath(sticker, imageMeta) {
    const imageFormat = (imageMeta.type == "animRegular") ? ".gif" : ".png";
    const pathPrefix = config.get('gcs.pathPrefix');
    const filePath = "stickers/"+sticker.stickerId+"/"+pathPrefix[imageMeta.type]+"/"+imageMeta.resType.toUpperCase()+imageFormat;
    return filePath;
}

module.exports = {
    upload: upload,
    generateLegacyGcsPath: generateLegacyGcsPath,
    generateGcsPath: generateGcsPath
}