var redis = require("redis");
var jsonfile = require('jsonfile')

var redisOptions = {
	host: "10.0.7.134", // staging
	port: 6379
}

var client = redis.createClient(redisOptions);

client.on("error", function (err) {
    console.log("Error " + err);
});

var forcepush = function() {
	client.hgetall("stkforcepush", function(error, value) {
		if(error) {
			console.log(error)
		}
		else {
			console.log(value)
		}
	})
}
// forcepush()

var forcepushall = function() {
	client.get("stkforcepushallids", function(error, value) {
		if(error) {
			console.log(error)
		}
		else {
			// console.log(value)
			value = JSON.parse(value)
			jsonfile.writeFile("response.json", value, {spaces: 2}, function (err) {
				console.log("request finished")
			})
		}
	})
}

// forcepushall()

exports.addStickerIdsToRedis = function(data, callback) {
	var stickers = {"stickers": data}
	stickers = JSON.stringify(stickers)
	client.set("stkforcepushallids", stickers, function(error, reply) {
		if(error) {
			callback(error, null)
		}
		else {
			callback(null, reply)
		}
	})
}

exports.deleteKey = function(key) {
	client.del(key)
}