'use strict';

const stickerService    = require('./services/sticker');
const async             = require('async');

module.exports.init = (query, limit) => {
    stickerService.getStickers(query, limit, (error, stickers) => {
        if(error) {
            console.log(error)
        }
        else {
            console.log(`Number of stickers for Query : ${JSON.stringify(query)} is ${stickers.length}`)
            async.eachSeries(stickers, (sticker, callback) => {
                async.waterfall([
                    (callback) => {
                        stickerService.getBaseUrlAndType(sticker, (error, response) => {
                            if(error) {
                                callback(error, null)
                            }
                            else {
                                callback(null, response)
                            }
                        })
                    },
                    (response, callback) => {
                        stickerService.update(sticker, response.isAnimated, response.baseUrl, (error, response) => {
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
                        console.log(`Error in processing lcid: ${sticker.lcid}, lsid: ${sticker.lsid}, stickerId: ${sticker.stickerId} `, error )
                    }
                    else {
                        console.log(`Sticker updated for lcid: ${sticker.lcid}, lsid: ${sticker.lsid}, stickerId: ${sticker.stickerId}` )
                    }
                    callback()
                })
            }, (error) => {
                if(error) {
                    console.log(error)
                }
                else {
                    console.log("Sticker Updation script finished for : "+stickers.length)
                }
            })
        }
    }) 
}