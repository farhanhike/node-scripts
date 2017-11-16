var mysql      = require('mysql');
var async      = require('async');

var jsonfile = require('jsonfile')


var connection = mysql.createConnection({
  host     : '10.0.7.141',
  user     : 'hike',
  password : 'h1kerS3my59l',
  database : 'stickerdb'
});


// connection.connect();

function getIds() {
    var stickers = require('./data.js').stickers
    async.eachSeries(stickers, function(sticker, callback) {
        var query = 'SELECT id,catid,sid FROM stickerdata WHERE catid = ' + connection.escape(sticker.catId) + 'AND sid = ' + connection.escape(sticker.sId)
        connection.query(query, function(err, results, fields) {
            if(err) {
                callback(err) 
            }
            else {
                sticker.id = results[0]["id"]
                callback()
            }
        })
    }, function(error) {
        if(error) {
            console.log(error)
        }
        else {
            jsonfile.writeFile("sticker_withid.json", stickers, {spaces: 2}, function (err) {
                console.log("Id fetching finished")
            })
        }
        connection.end();
    })
}

// getIds()

var replies_result = []
function getReplies() {
    var stickers = require('./sticker_withid')
    
    async.eachSeries(stickers, function(sticker, callback) {
        var sqlId = sticker.id
        
        var query = 'SELECT id,reco_id,score FROM qs_reply WHERE id = ' + connection.escape(sqlId) + ' AND rejected = 0 ORDER BY score DESC '
        connection.query(query, function(err, results, fields) {
            if(err) {
                callback(err) 
            }
            else {
                var recoIds = [];
                for(var i=0; i<results.length; i++) {
                    recoIds.push(results[i].reco_id)
                }
                if(recoIds.length == 0) {
                    console.log(" Not found : " + sqlId)
                    callback()
                }
                else {
                    var newquery = 'SELECT id,catid,sid FROM stickerdata WHERE id in (' + connection.escape(recoIds) + ")"
                    connection.query(newquery, function(error, new_data, fields) {
                        if(error) {
                            callback(error)
                        }
                        else {
                            for(var i=0; i<new_data.length; i++) {
                                var info = {
                                    catId: sticker.catId,
                                    sId: sticker.sId
                                }
                                info['replyCatId'] = new_data[i]['catid']
                                info['replySId'] = new_data[i]['sid']
                                replies_result.push(info)
                            }
                            callback()
                        }
                    })
                }
            }
        })
    }, function(error) {
        if(error) {
            console.log(error)
        }
        else {
            jsonfile.writeFile("sticker_reply.json", replies_result, {spaces: 2}, function (err) {
                console.log("Reply fetching finished")
            })
        }
        connection.end();
    })
}
// getReplies()
