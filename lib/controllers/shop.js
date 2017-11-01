var async = require('async');
var request = require('request');
var jsonfile = require('jsonfile')

exports.shop = function() {
	var ucids = []
	var ucidsMap = []
	var headers = {
		"Cookie": "uid=VuSCUoRXr0AdxNyh;user=xJzW91xFXUs="
	}
	async.series({
		getuids: function(callback) {
			var options = {
				url: 'http://stickers.im.hike.in/v4/shop/fetch_shop_order?offset=0&N=2000&anim=1',
				method: 'GET',
				headers: headers
			}
	
			request(options, function(err, res, body) {  
				if(err) {
					callback(err, null)
				}
				else {
					let json = JSON.parse(body);
					if(json.data && json.data.packs) {
						ucids = json.data.packs
						for (var i=0; i<ucids.length; i++) {
							var dict = {}
							dict[ucids[i]] = 0
							ucidsMap.push(dict)
						}
						callback(null, 'done')
					}
					else {
						callback("no data for uids", null)
					}
				}
			});
		},
		getPackMeta: function(callback) {
			var bodyData = {
				anim: 1,
				ucids: ucidsMap
			}

			var options = {
				url: 'http://stickers.im.hike.in/v4/shop/update_metadata',
				method: 'POST',
				headers: headers,
				body: bodyData,
				json: true
			}

			request(options, function(err, res, body) {  
				if(err) {
					console.log(err)
				}
				else {
					jsonfile.writeFile("pack_meta.json", body.data.packs, {spaces: 2}, function (err) {
				  	callback(null, 'done')
					})
				}
			})
		},
		getPackTags: function(callback) {
			var bodyData = {
				anim: 1,
				ucids: ucidsMap
			}

			var options = {
				url: 'http://stickers.im.hike.in/v4/shop/update_tags',
				method: 'POST',
				headers: headers,
				body: bodyData,
				json: true
			}

			request(options, function(err, res, body) {  
				if(err) {
					console.log(err)
				}
				else {
					console.log(body.data)
					jsonfile.writeFile("pack_tag.json", body.data.packs, {spaces: 2}, function (err) {
				  	callback(null, 'done')
					})
				}
			})
		}
	}, function(error, values) {
		console.log('done')
	})
}