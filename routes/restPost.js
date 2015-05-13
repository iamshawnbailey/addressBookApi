var express = require('express');
var router = express.Router();
var assert = require('assert');
var url = require('url');
var searchstring = require('../bin/SearchString');
var querystring = require('querystring');
var mongoConnection = require('../bin/MongoConnection');

var parsedURL;
var qString;
var qStringValues = [];
var json;

/* GET home page. */
router.post('/*', function(req, res, next) {
	parsedURL = url.parse(req.url);
	qString = searchstring.getSearchString(parsedURL);
	json = searchstring.getQueryStringValues(qString);
	
	var pathArray = req.path.toString().split('/');
	var collection = pathArray[pathArray.length - 1];
	console.log('****** restPost Debug: ' + collection);
	mongoConnection.mongoOperation('insert', json, collection);
	res.render('index', { title: json });
});

module.exports = router;