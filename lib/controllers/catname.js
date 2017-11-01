var mongoose 				= require('mongoose')
	, async 					= require('async')
	, ObjectId 				= mongoose.Types.ObjectId
	, CatName   			= mongoose.model('CatName')
	, Sticker   			= mongoose.model('Sticker')
	, TagData 				= mongoose.model('TagData')
// CatName.findOne({}, function(error, value) {
// 	if(error) {
// 		console.log(error)
// 	}
// 	else {
// 		console.log(value)
// 	}
// })
