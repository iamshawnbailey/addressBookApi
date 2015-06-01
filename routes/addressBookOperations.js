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
var baseURL = ''
var resourceType
var collection
var location
var links


//  Run any GET requests and take the second entry in the path and populate the 'collection' variable with the value
//  The 'collection' variable is used by mongoConnection to set the DB instance we connect to
router.get('/*', function(req, res, next) {
	console.log('AddressBookOperations.get value of collection: ' + collection);
	setBaseUrl()
	parsedURL = url.parse(req.url);
	var pathArray = req.path.toString().split('/')

	if(pathArray.length > 1){
		collection = pathArray[1]
	}

	if(pathArray.length == 2){
		resourceType = 'addressbook'
		location = baseURL + collection
		links = JSON.parse('{"contacts" : "' + baseURL + collection + '/contacts/", "groups" : "' + baseURL + collection + '/groups/"}')
	}

	buildJsonStringModule.buildJsonString(resourceType, 'get', req, jsonQueryString, collection, function(err, jsonStringArg){
		jsonString = jsonStringArg
		mongoConnection.mongoOperation(resourceType, 'get', jsonString, jsonQueryString, dbname, collection, function(err, responseString){
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
	console.log('AddressBookOperations.post() running')
	setBaseUrl()
	var pathArray = req.path.toString().split('/');
	parsedURL = url.parse(req.url);
	var qString = searchstring.getSearchString(parsedURL);

	if(pathArray.length > 1){
		collection = pathArray[1]
	}

	// Path indicates an addressbook creation
	if((pathArray.length == 2)){
		resourceType = 'addressbook'

		buildJsonStringModule.buildJsonString(resourceType, 'post', req, jsonQueryString, collection, function(err, jsonStringArg) {
			jsonString = jsonStringArg
			console.log('AddressBookOperations.post() value of jsonString passed to mongoConnection.mongoOperation(): ' + jsonString);
			mongoConnection.mongoOperation(resourceType, 'post', jsonString, jsonQueryString, dbname, collection, function (err, responseString) {

				if (!err) {
					console.log("AddressBookOperations.post() response: " + responseString)
					res.status(201).json(JSON.parse(responseString))
				} else {
					console.log("AddressBookOperations.post() error response: " + err.toString())
					res.status(500).json(err)

				}
			})
		})

	//  Here the path indicates that it's a Group creation
	}else if((pathArray.length == 3) && (pathArray[2] == 'groups')){
		resourceType = 'group'

		console.log('AddressBookOperations.post() Request Body for Group Creation: ' + req.body)

		buildJsonStringModule.buildJsonString(resourceType, 'post', req, jsonQueryString, collection, function(err, jsonStringArg) {
			jsonString = jsonStringArg

			console.log('AddressBookOperations.post() creating a new Group with jsonString: ' + jsonString)

			mongoConnection.mongoOperation(resourceType, 'post', jsonString, jsonQueryString, dbname, collection, function(err, responseString) {

				if(!err) {
					console.log("AddressBookOperations.post() response: " + responseString)
					res.status(201).json(JSON.parse(responseString))
				}else{
					console.log("AddressBookOperations.post() error response: " + err.toString())
					res.status(500).json(err)

				}
			})

		})
	}
});





router.put('/*', function(req, res, next){
	console.log('PUT placeholder');
});

router.patch('/*', function(req, res, next){
	console.log('AddressBookOperations.patch()')
})

function setBaseUrl(){
	if(baseURL == ''){
		baseURL = config.getBaseUrl()
	}
}

module.exports = router;