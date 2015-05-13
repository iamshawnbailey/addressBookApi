var express = require('express');
var router = express.Router();
var assert = require('assert');
var mongoConnection = require('../bin/MongoConnection');

var json;

//  Take any request that includes '/get' in the path, take the second entry in the path and populate the 'collection' variable with the value
//  The 'collection' variable is used by mongoConnection to set the DB instance we connect to
router.get('/*', function(req, res, next) {
	var pathArray = req.path.toString().split('/');
	var collection = pathArray[1];
	console.log('****** restGet Debug: ' + collection);
	var result = mongoConnection.mongoOperation('query', json, collection)
	res.render('index', result);
});

module.exports = router;