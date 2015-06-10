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
		console.log('AddressBookOperations.readFile() Hash Key Value: ' + routerObjectArray[i].pathlength + routerObjectArray[i].pathname)
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

	//  Find the Hash entry for the combination of the path length and pathname
	//  The index is 0 based so we have to subtract 1 from the length value
	routerObject = routerObjectHash[(pathArray.length - 1) + pathArray[pathArray.length - 1]]
	if(!routerObject){
		routerObject = routerObjectHash[(pathArray.length - 1) + pathArray[pathArray.length - 2]]
	}

	resourceType = routerObject.resourcetype
	location = baseURL + collection
	console.log('AddressBookOperations.get() found route for Resource Type: ' + resourceType)

	//  For each link associated with the route we need to build the string to then convert to a JSON object
	for(i=0; i < routerObject.links.length; i++){

		//  All links start with the name of the link and the URL has the same base
		linksString = linksString + routerObject.links[i].name + '" : "' + baseURL + collection + '/'

		//  Loop through the path entries for each link
		//  The path entries can come from the request path, request body or the router definition
		for(y=0; y < routerObject.links[i].path.length; y++){
			switch(routerObject.links[i].path[y].source) {
				case 'path':
					linksString = linksString + req.path.toString().split('/')[routerObject.links[i].path[y].index] + '/'
					break
				case 'body':
					linksString = linksString + req.body[routerObject.links[i].path[y].value] + '/'
					break
				default:
					linksString = linksString + routerObject.links[i].path[y].value + '/'
					break
			}
		}

		if(i == routerObject.links.length - 1) {
			linksString = linksString + '"}'
		}else{
			linksString = linksString + '", "'
		}
	}

	console.log('AddressBookOperations.get() Links String: ' + linksString)
	console.log('AddressBookOperations.get() Links String: ' + linksString)
	links = JSON.parse(linksString)
	linksString = '{"'

	//  Build the JSON string that will be used for the GET operation on the DB
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

	routerObject = routerObjectHash[(pathArray.length - 1) + pathArray[pathArray.length - 1]]
	if(!routerObject){
		routerObject = routerObjectHash[(pathArray.length - 1) + pathArray[pathArray.length - 2]]
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