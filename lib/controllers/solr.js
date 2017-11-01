var solr = require('solr-client');
var jsonfile = require('jsonfile');

var options = {
	host: "127.0.0.1",
	port: 8983,
	core: "stickers"
}

var client = solr.createClient(options);
client.autoCommit = true;

exports.search = function(text, callback) {
	text = text+"*"
	text	= "title:"+text+"^5 || typos:"+text+"^0.1"
	var query = client.createQuery()
		.q(text)
		.fl("*,score")
		.start(0)
		.rows(20);

	client.search(query,function(err,obj){
		if(err){
   		callback(err, null)
   	}
   	else {
   		jsonfile.writeFile("response.json", obj, {spaces: 2}, function (err) {
				callback(null, obj)
			})
   	}
	});
}