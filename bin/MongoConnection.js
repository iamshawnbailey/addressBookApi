#!/usr/bin/env node
//  Used for MongoDB operations.
//  The DB Name is 'addressbook'
//  The addressbook records are in the 'addressbooks' collection
//  The contact and group records for an addressbook are in collections named after the particular addressbook
//  TODO:  Insertion and Query of Contact records

var assert = require('assert');
var config = require('./ParseConfig')
var buildJsonStringModule = require('./BuildJsonString')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var mongoURL
var dbConnection
var resourceType
var jsonQueryString
var jsonString
var addressBooks = []
var addressBookExists = false
var addressBookId
var contactId
var groupId
var origCollection = ''

//  Entry point for the module that is called by addressBookOperations
exports.mongoOperation = function(resourceTypeArg, operation, jsonStringArg, jsonQueryStringArg, dbname, collection, callback) {

	//  Check if we already have a connection object available.  If not, create one and execute the operation.
	//  If we have one, use it for the operation
	//  callback to addressBookOperations with err or response payload
	resourceType = resourceTypeArg
	jsonString = jsonStringArg
	jsonQueryString = jsonQueryStringArg
	addressBookId = collection

	//  When performing an operation on an addressbook we keep a record in the addressbooks collection while the addressbook name is also a collection
	if(resourceType == 'addressbook'){
		origCollection = collection
		collection = 'addressbooks'
	}

	if (dbConnection == null) {
		console.log('MongoConnection.mongoOperation() creating a new mongo connection')
		getConnection(dbname, function (err, dbConnection) {
			if (err) {
				console.log('MongoConnection.mongoOperation() DB Connection Error: ' + err.toString())
			}else{
				selectOperation(resourceType, operation, jsonString, dbname, collection, function (err, jsonObjectsArray) {
					if (!err) {
						callback(err, jsonObjectsArray)
					}else{
						console.log('MongoConnection.mongoOperation() Error with selectOperation: ' + err.toString())
						callback(err, err)
					}
				})
			}
		})
	}else{
		console.log('MongoConnection.mongoOperation() using existing mongo connection')

		//  Have to search for the addressbook to see if it exists before calling selectOperation
		//  If the addressbook doesn't exist then we create it on the POST
		console.log('MongoConnection.mongoOperation() calling selectOperation with operation: ' + operation)

		selectOperation(resourceType, operation, jsonString, dbname, collection, function (err, jsonObjectsArray) {

			if(!err){
				console.log('MongoConnection.mongoOperation() success on selectOperation')
				callback(err, jsonObjectsArray)
			}else{
				console.log('MongoConnection.mongoOperation() error on selectOperation: ' + err.toString())
				callback(err, err)
			}
		})
	}
}


//  This function determines the operation to perform and calls the appropriate function
//  callback to mongoOperation with error or result
function selectOperation(reourceType, operation, jsonString, dbname, collection, callback){

	console.log('MongoConnection.selectOperation()dbConnection equals: ' + dbConnection)


	if(operation == 'get') {

		console.log('MongoConnection.selectOperation() Connected to MongoDB with URL: ' + mongoURL + collection);
		mongoQuery(dbConnection, jsonString, collection, function (err, jsonObjectsArray) {
			callback(err, jsonObjectsArray)
		})
	}else if(operation == 'post') {

		// If we're creating a new Addressbook then we need to create the new collectino and add some constraints
		if (resourceType == 'addressbook') {
			mongoCreateAddressbook(dbConnection, dbname, JSON.parse(jsonString).name, function (err) {
				if (err) {
					callback(err, jsonString)
				}

				return
			})
		}

		console.log('MongoConnection.selectOperation() Connected to MongoDB with URL: ' + mongoURL + collection);
		mongoInsert(dbConnection, jsonString, collection, function (err, jsonString) {
			//console.log('Closing DB Connection');
			//dbConnection.close()
			callback(err, jsonString)
		})
	}else if(operation == 'put'){
		console.log('MongoConnection.selectOperation() running put operation')

		console.log('MongoConnection.selectOperation() Connected to MongoDB with URL: ' + mongoURL + collection);
		mongoPut(dbConnection, jsonString, collection, function (err, jsonString) {
			//console.log('Closing DB Connection');
			//dbConnection.close()
			callback(err, jsonString)
		})
	}else if(operation == 'delete'){
		console.log('MongoConnection.selectOperation() running delete operation')

		mongoDelete(dbConnection, jsonString, collection, function (err, result) {
			if(!err){

				//  When deleting an addressbook we delete the record from the addressbooks collection and drop the addressbook collection
				if(collection == "addressbooks"){

					// To drop the collection we need to ensure that we pass the addressbook name as the collection
					mongoDropCollection(dbConnection, origCollection, function(err, result){
						callback(err, result)
					})
				}else{

					//  Otherwise the collection value should always be the addressbook name
					mongoDropCollection(dbConnection, collection, function(err, result){
						callback(err, result)
					})
				}


			}else {
				callback(err, result)
			}
		})
	}

}



//  Get the connection to Mongo and return it in the callback
function getConnection(dbname, callback){
	mongoURL = 'mongodb://' + config.getMongoHost() + ':' + config.getMongoPort() + '/'
	console.log('getConnection with URL: ' + mongoURL)
	MongoClient.connect(mongoURL + dbname, function(err, db) {
		if (!err) {
			console.log('MongoConnection.getConnection() Getting Mongo Connection')
			dbConnection = db
			callback(err, dbConnection)
		}else{
			console.log('MongoConnection.getConnection() Error in MongoConnection.getConnection(): ' + err.toString())
			callback(err, dbConnection)
		}
	})
}

//  Function to create a new Addressbook
//  This is run first to create the collection and add constraints
//  The creation of the addressbook record in the addressbooks collection is handled by mongoInsert
function mongoCreateAddressbook(dbConnection, dbname, collection, callback){
	console.log('MongoConnection.mongoCreateAddressbook() creating new addressbook')
	dbConnection.collection(collection).createIndex({"name":1,"resourcetype":1}, {unique:true}, function(err, result){
		if(!err){
			console.log("MongoConnection.mongoCreateAddressbook() Created a new Addressbook")
			callback(err, jsonString)
		}else{
			console.log("MongoConnection.mongoCreateAddressbook() Error creating new Addressbook: " + err.toString());
			callback(err, err);
		}
	})
}

//  Handles all insert operations to the DB
function mongoInsert(dbConnection, jsonString, collection, callback){
	console.log('MongoConnection.mongoInsert() Connected to Mongo for insert with:' + jsonString);
	console.log('MongoConnection.mongoInsert() Inserting with JSON: ' + jsonString)
	dbConnection.collection(collection).insertOne(JSON.parse(jsonString), function(err, result){
		//assert.equal(err, null);
		if(!err){
			console.log("MongoConnection.mongoInsert() Inserted a document")
			callback(err, jsonString)
		}else{
			console.log("MongoConnection.mongoInsert() Error inserting record: " + err.toString());
			callback(err, err);
		}
	})
}


function mongoPut(dbConnection, jsonString, collection, callback){
	console.log('MongoConnection.mongoPut() Connected to Mongo for put with:' + jsonString);
	console.log('MongoConnection.mongoPut() Updating document with JSON: ' + jsonString)
	var jsonObject = JSON.parse(jsonString)
	var replaceId = '{"recordtype" : "' + jsonObject.recordtype + '", "recordid" : "' + JSON.parse(jsonString).recordid + '"}'
	dbConnection.collection(collection).replaceOne(JSON.parse(replaceId), jsonObject, function(err, result){
		//assert.equal(err, null);
		if(!err){
			console.log("MongoConnection.mongoInsert() Inserted a document")
			callback(err, jsonString)
		}else{
			console.log("MongoConnection.mongoInsert() Error inserting record: " + err.toString());
			callback(err, err);
		}
	})
}


//  Handles all query operations to the DB
function mongoQuery(dbConnection, jsonString, collection, callback){
	var returnString = ''
	console.log('MongoConnection.mongoQuery() Connected to Mongo to query collection: ' + collection);
	console.log('MongoConnection.mongoQuery() Using JSON Query String: ' + jsonString)
	var cursor = dbConnection.collection(collection).find(JSON.parse(jsonString))
	cursor.toArray(function(err, jsonObjectsArray){

		// if the cursor is empty then we will return a specific error message
		if(jsonObjectsArray.length == 0){
			errString = '{"code" : 1234, "message" : {"message" : "No results found", "collection" : "' + collection + '", "query" : ' + jsonString + '}}'
			console.log('MongoConnection.mongoQuery() Empty Resultset errString: ' + errString)
			buildJsonStringModule.buildJsonString(resourceType, 'error', JSON.parse(errString), jsonQueryString, collection, function(err, jsonStringArg){
				console.log('MongoConnection.mongoQuery() Returning empty resultset error: ' + jsonStringArg)
				callback(jsonStringArg, jsonStringArg)
			})
		}else{
			for(i=0;i<jsonObjectsArray.length;i++){
				returnString = returnString + JSON.stringify(jsonObjectsArray[i])
			}
			console.log('MongoConnection.mongoQuery() return string: ' + returnString)
			callback(err, returnString)
		}
	})
}


function mongoDelete(dbConnection, jsonString, collection, callback){
	console.log('MongoConnection.mongoDelete() Delete JSON String: ' + jsonString)

	dbConnection.collection(collection).deleteMany(JSON.parse(jsonString), function(err, result){
		if(!err){
			callback(err, result)
		}else{
			callback(err, result)
		}
	})
}


function mongoDropCollection(dbConnection, collection, callback){
	console.log('MongoConnection.mongoDropCollection() Collection: ' + collection)

	dbConnection.collection(collection).drop(function(err, result){
		callback(err, result)
	})
}

