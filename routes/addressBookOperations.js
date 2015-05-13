var express = require('express');
var router = express.Router();
var assert = require('assert');
var url = require('url');
var searchstring = require('../bin/SearchString');
var querystring = require('querystring');
var mongoConnection = require('../bin/MongoConnection');

var json;
var dbname = 'addressbook';

//  Take any request that includes '/get' in the path, take the second entry in the path and populate the 'collection' variable with the value
//  The 'collection' variable is used by mongoConnection to set the DB instance we connect to
router.get('/*', function(req, res, next) {
	console.log('****** restGet Debug: ' + collection);
	var result = mongoConnection.mongoOperation('query', json, dbname, collection)
	res.render('index', result);
});


router.post('/*', function(req, res, next) {
	parsedURL = url.parse(req.url);
	qString = searchstring.getSearchString(parsedURL);
	json = searchstring.getQueryStringValues(qString);
	console.log('POST Path: ' + req.path);
	var pathArray = req.path.toString().split('/');
	var collection = pathArray[1];
	console.log('****** restPost Debug: ' + collection);
	mongoConnection.mongoOperation('insert', json, dbname, collection);
	res.render('index', { title: json });
});


router.put('/*', function(req, res, next){
	console.log('PUT placeholder');
});

module.exports = router;