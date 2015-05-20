var express = require('express');
var router = express.Router();
var assert = require('assert');
var url = require('url');
var searchstring = require('../bin/SearchString');
var config = require('../bin/ParseConfig')
var buildJsonStringModule = require('../bin/BuildJsonString')
var querystring = require('querystring');
var mongoConnection = require('../bin/MongoConnection');

var jsonString
var jsonQueryString
var dbname = 'addressbook'
var baseURL
var resourceType
var collection
var location
var links

//  Run any GET requests and take the second entry in the path and populate the 'collection' variable with the value
//  The 'collection' variable is used by mongoConnection to set the DB instance we connect to
router.get('/*', function(req, res, next) {
	console.log('AddressBookOperations.get value of collection: ' + collection);
	baseURL = 'http://' + config.getListenAddress() + ':' + config.getListenPort() + '/api/' + config.getVersion() + '/addressbook/'
	parsedURL = url.parse(req.url);
	var pathArray = req.path.toString().split('/')
	if(pathArray.length == 2){
		resourceType = 'addressbook'
		collection = pathArray[1]
		location = baseURL + collection
		links = JSON.parse('{"contacts" : "' + baseURL + collection + '/contacts/", "groups" : "' + baseURL + collection + '/groups/"}')
	}

	buildJsonStringModule.buildJsonString(resourceType, 'query', jsonQueryString, collection, function(err, jsonStringArg){
		jsonString = jsonStringArg
		mongoConnection.mongoOperation(resourceType, 'query', jsonString, jsonQueryString, dbname, collection, function(err, responseString){
			if(!err) {
				console.log("AddressBookOperations.get() response: " + responseString)
				res.location(location)
				res.links(links)
				res.status(200).json(JSON.parse(responseString))
			}else{
				console.log("AddressBookOperations.get() error response: " + err.toString())
				res.status(500).json(err)
			}
		})
	})
})


//  Run any POST requests and build the HTTP response
router.post('/*', function(req, res, next) {
	baseURL = 'http://' + config.getListenAddress() + ':' + config.getListenPort() + '/api/' + config.getVersion() + '/addressbook/'
	var pathArray = req.path.toString().split('/');
	parsedURL = url.parse(req.url);
	var qString = searchstring.getSearchString(parsedURL);

	if((pathArray.length == 2)&(qString == '')){
		resourceType = 'addressbook'
		collection = pathArray[1];

		jsonString = '{"name" : "' + collection + '","url" : "' + baseURL + collection + '" }'
		console.log('AddressBookOperations.post() value of jsonString passed to mongoConnection.mongoOperation(): ' + jsonString);
		mongoConnection.mongoOperation(resourceType, 'insert', jsonString, jsonQueryString, dbname, collection, function(err, responseString) {

			if(!err) {
				console.log("AddressBookOperations.post() response: " + responseString)
				res.status(201).json(JSON.parse(responseString))
			}else{
				console.log("AddressBookOperations.post() error response: " + err.toString())
				res.status(500).json(err)

			}
		})
	}
});





router.put('/*', function(req, res, next){
	console.log('PUT placeholder');
});

module.exports = router;