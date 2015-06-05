var fs = require('fs')
var express = require('express');
var router = express.Router();
var assert = require('assert');
var url = require('url');
var searchstring = require('../bin/SearchString');
var config = require('../bin/ParseConfig')
var buildJsonStringModule = require('../bin/BuildJsonString')
var querystring = require('querystring');
var mongoConnection = require('../bin/MongoConnection');

var routerDefinitions
var routerObjectArray
var routerObjectHash = new Object()
var routerObject
var jsonString
var jsonQueryString
var dbname = 'addressbook'
var baseURL = ''
var resourceType
var collection
var location
var links
var linksString = '{"'

//  Load the route definitions from file
fs.readFile('./definitions/router_definitions.json', function(err, data){
	console.log('AddressBookOperations.fs.readFile() Router Definitions data: ' + data)
	routerDefinitions = JSON.parse(data)
	routerObjectArray = routerDefinitions.routes

	for(i=0; i<routerObjectArray.length; i++){
		routerObjectHash[routerObjectArray[i].pathlength + routerObjectArray[i].pathname] = routerObjectArray[i]
	}

	if(err){
		console.log('AddressBookOperations.fs.readFile() Error reading router_definitions.json: ' + err)
	}

})

//  Run any GET requests and take the second entry in the path and populate the 'collection' variable with the value
//  The 'collection' variable is used by mongoConnection to set the DB instance we connect to
router.get('/*', function(req, res, next) {
	setBaseUrl()
	parsedURL = url.parse(req.url);
	var pathArray = req.path.toString().split('/')

	//  The 0 index is empty so we set it to the pathroot value from the definitions file
	pathArray[0] = routerDefinitions.pathroot
	console.log('AddressBookOperations.get() pathArray: ' + pathArray.toString())

	//  Set the collection value to the name of the addressbook
	if(pathArray.length > 1){
		collection = pathArray[1]
	}

	routerObject = routerObjectHash[pathArray.length + pathArray[pathArray.length - 1]]
	if(!routerObject){
		routerObject = routerObjectHash[pathArray.length + pathArray[pathArray.length - 2]]
	}

	resourceType = routerObject.resourcetype
	location = baseURL + collection
	console.log('AddressBookOperations.get() found route for Resource Type: ' + resourceType)

	//  For each link associated with the route we need to build the string to then convert to a JSON object
	for(y=0; y < routerObject.links.length; y++){
		if(y == routerObject.links.length - 1){
			linksString = linksString + routerObject.links[y].name + '" : "' + baseURL + collection + routerObject.links[y].path + '"}'
		}else{
			linksString = linksString + routerObject.links[y].name + '" : "' + baseURL + collection + routerObject.links[y].path + '", "'
		}
	}

	console.log('AddressBookOperations.get() Links String: ' + linksString)
	console.log('AddressBookOperations.get() Links String: ' + linksString)
	links = JSON.parse(linksString)
	linksString = '{"'


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
				res.status(500).json(JSON.parse(err))
			}
		})
	})
})


//  Run any POST requests and build the HTTP response
router.post('/*', function(req, res, next) {
	console.log('AddressBookOperations.post() running')
	setBaseUrl()
	var pathArray = req.path.toString().split('/');
	pathArray[0] = routerDefinitions.pathroot


	if(pathArray.length > 1){
		collection = pathArray[1]
	}

	routerObject = routerObjectHash[pathArray.length + pathArray[pathArray.length - 1]]
	if(!routerObject){
		routerObject = routerObjectHash[pathArray.length + pathArray[pathArray.length - 2]]
	}

	resourceType = routerObject.resourcetype
	location = baseURL + collection
	console.log('AddressBookOperations.post() found route for Resource Type: ' + resourceType)

	//  Not all route entries can have a query string
	if (routerObject.querystring == true) {
		parsedURL = url.parse(req.url);
		var qString = searchstring.getSearchString(parsedURL);
	}

	//  Build the JSON string that will be passed to the MongoConnection module
	buildJsonStringModule.buildJsonString(resourceType, 'post', req, jsonQueryString, collection, function(err, jsonStringArg) {
		jsonString = jsonStringArg
		console.log('AddressBookOperations.post() value of jsonString passed to mongoConnection.mongoOperation(): ' + jsonString);

		//  Call the MongoConnection Module and pass it some parameters
		mongoConnection.mongoOperation(resourceType, 'post', jsonString, jsonQueryString, dbname, collection, function (err, responseString) {

			if (!err) {
				console.log("AddressBookOperations.post() response: " + responseString)
				res.status(201).json(JSON.parse(responseString))
			} else {
				console.log("AddressBookOperations.post() error response: " + err.toString())
				buildJsonStringModule.buildJsonString(resourceType, 'error', err, jsonQueryString, collection, function(err, jsonStringArg){
					console.log('AddressBookOperations.post() Returning error JSON: ' + jsonStringArg)
					res.status(500).json(JSON.parse(jsonStringArg))
				})
			}
		})
	})
});



router.put('/*', function(req, res, next){
	console.log('PUT placeholder');
});

router.patch('/*', function(req, res, next){
	console.log('AddressBookOperations.patch()')
})


router.delete('/*', function(req, res, next){
	console.log('AddressBookOperation.delete()')

	var pathArray = req.path.toString().split('/');
	pathArray[0] = routerDefinitions.pathroot

	if(pathArray.length > 1){
		collection = pathArray[1]
		console.log('AddressBookOperations.delete() Collection: ' + collection)
	}

	routerObject = routerObjectHash[pathArray.length + pathArray[pathArray.length - 1]]
	if(!routerObject){
		routerObject = routerObjectHash[pathArray.length + pathArray[pathArray.length - 2]]
	}

	resourceType = routerObject.resourcetype
	location = baseURL + collection
	console.log('AddressBookOperations.delete() found route for Resource Type: ' + resourceType)

	if (routerObject.querystring == true) {
		parsedURL = url.parse(req.url);
		var qString = searchstring.getSearchString(parsedURL);
	}


	buildJsonStringModule.buildJsonString(resourceType, 'delete', req, jsonQueryString, collection, function(err, jsonStringArg) {
		jsonString = jsonStringArg
		console.log('AddressBookOperations.delete() value of jsonString passed to mongoConnection.mongoOperation(): ' + jsonString);
		mongoConnection.mongoOperation(resourceType, 'delete', jsonString, jsonQueryString, dbname, collection, function (err, responseString) {

			if (!err) {
				console.log("AddressBookOperations.delete() response: " + responseString)
				res.status(201).json(JSON.parse(responseString))
			} else {
				console.log("AddressBookOperations.delete() error response: " + err.toString())
				res.status(500).json(err)
			}
		})
	})
})


function setBaseUrl(){
	if(baseURL == ''){
		baseURL = config.getBaseUrl()
	}
}

module.exports = router;