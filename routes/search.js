var express = require('express');
var router = express.Router();
var solr = require('./../lib/controllers/solr')

router.get('/', function(req, res, next) {
	res.render('search')
})

router.post('/', function(req, res, next) {
	var searchText = req.body.text;
	if (searchText && searchText.trim() != "") {
		solr.search(searchText, function(error, value) {
			if(error) {
				res.json({error: true, value: error})
			}
			else {
				var docs = []
				var total = 0
				if (value.response && value.response.numFound > 0) {
					total = value.response.numFound
					docs = value.response.docs
				}
				res.json({error: false, value: docs, total: total})
			}
		})
	} else {
		res.json({error: false, value: []})
	}
})

module.exports = router;
