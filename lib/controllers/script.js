var async = require('async');
var request = require('request');
var jsonfile = require('jsonfile')

var cookie = "uid=VuSCUoRXr0AdxNyh;user=xJzW91xFXUs="
exports.sendPostRequest = function(url, cookie) {
	var headers = {
		"Cookie": cookie
	}

	var options = {
		url: url,
		method: 'POST',
		headers: headers,
		body: {},
		json: true
	}
	
	request(options, function(err, res, body) {  
		if(err) {
			console.log("Error",e)
		}
		else {
			jsonfile.writeFile("response.json", body, {spaces: 2}, function (err) {
				console.log("request finished")
			})
		}
	});
}

// exports.userlist = function() {
// 	User.find({phone_num: {$exists: false}}, {phone:1, fullName:1, gender:1, phone:1, youtube:1}).exec(function(error, users) {
// 		if(error) {
// 			console.log(error)
// 		}
// 		else {
// 			console.log("Users length : "+users.length)
// 			async.eachLimit(users, 100, function(user, callback) {
// 				var phone_num = ""
// 				var stream_count = 0
// 				if(user.phone && user.phone.mobile) {
// 					phone_num = user.phone.prefix + user.phone.mobile
// 				}
// 				Stream.count({user: user._id}, function(error, count) {
// 					if(error) {
// 					}
// 					else {
// 						stream_count = count
// 					}
// 					User.update({_id: user._id}, {$set: {stream_count: stream_count, phone_num: phone_num}}, function(error, value){
// 						callback()
// 					})
// 				})
// 			}, function(error) {
// 				console.log("Finsished")
// 			})
// 		}
// 	})
// }
