#!/usr/bin/env node
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

//  Entry point for the module that is called by addressBookOperations
exports.mongoOperation = function(resourceTypeArg, operation, jsonStringArg, jsonQueryStringArg, dbname, collection, callback) {

	//  Check if we already have a connection object available.  If not, create one and execute the operation.
	//  If we have one, use it for the operation
	//  callback to addressBookOperations with err or response payload
	resourceType = resourceTypeArg
	jsonString = jsonStringArg
	jsonQueryString = jsonQueryStringArg
	addressBookId = collection

	if(resourceType == 'addressbook'){
		collection = 'addressbooks'
	}

	if (dbConnection == null) {
		console.log('MongoConnection.mongoOperation() creating a new mongo connection')
		getConnection(dbname, function (err, dbConnection) {
			if (err) {
				console.log('MongoConnection.mongoOperation() DB Connection Error: ' + err.toString())
			}else{

				//  Load up the existing addressbooks from the addressbooks collection
				loadAddressBooks(dbConnection, function(err, addressBooks){
					console.log('MongoConnection.mongoOperation() receive addressBooks array with contents: ' + addressBooks.toString())

					console.log('MongoConnection.mongoOperation()New DB Connection, calling selectOperation with operation: ' + operation)

					selectOperation(resourceType, operation, jsonString, dbname, collection, function (err, jsonObjectsArray) {
						if (!err) {
							callback(err, jsonObjectsArray)
						}else{
							console.log('MongoConnection.mongoOperation() Error with selectOperation: ' + err.toString())
							callback(err, err)
						}
					})
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

	if(operation == 'insert') {

		console.log('Connected to MongoDB with URL: ' + mongoURL + collection);
		mongoInsert(dbConnection, jsonString, collection, function (err, jsonString) {
			//console.log('Closing DB Connection');
			//dbConnection.close()
			callback(err, jsonString)
		})

	}else if(operation == 'query'){

		buildJsonStringModule.buildJsonString(resourceType, operation, jsonQueryString, function(err, jsonString){
			console.log('Connected to MongoDB with URL: ' + mongoURL + collection);
			mongoQuery(dbConnection, jsonString, collection, function(err, jsonObjectsArray){
				//db.close();
				callback(err, jsonObjectsArray)
			})
		})

	}
}


//  Loads the addressbooks from the DB and populates the addressBooks array with the name values
function loadAddressBooks(dbConnection, callback){
	var cursor = dbConnection.collection('addressbooks').find()
	cursor.toArray(function(err, array){
		console.log('MongoConnection.loadAddressBooks() cursor array contents: ' + array)
		for(i=0;i<array.length;i++){
			console.log('MongoConnection.loadAddressBooks() array element value: ' + JSON.stringify(array[i]))
			addressBooks.push(array[i].name)
		}
		console.log('MongoConnection.loadAddressBooks() addressbooks array contents: ' + addressBooks.toString())
		callback(err, addressBooks)
	})

}

//  Search the addressBooks array for the current collection value
//  If it's not already in the array then we insert it as a new addressbook and then push it onto the array
function searchAndCreateAddressBook(addressBooks, addressBookId, jsonString, callback){
	var error
	for(i=0; i<addressBooks.length; i++ ){
		console.log('MongoConnection.searchAndCreateAddressBook() addressbook: ' + addressBooks[i])
		if(addressBooks[i] == addressBookId) {
			addressBookExists = true
		}
	}

	//  If the addressbook does not exist then add it to the addressbooks collection
	if(addressBookExists == false){
		console.log('MongoConnection.searchAndCreateAddressBook() creating a new Address Book with: ' + jsonString)
		mongoInsert(dbConnection, jsonString, 'addressbooks', function(err, result){
			if(err){
				console.log('MongoConnection.searchAndCreateAddressBook() Error inserting new AddressBook: ' + err.toString())
				callback(err, addressBookId)
			}else{
				addressBooks.push(addressBookId)
				callback(err, addressBookId)
			}
		})
	}else{
		callback(error, jsonString)
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


//  Handles all query operations to the DB
function mongoQuery(dbConnection, jsonString, collection, callback){
	console.log('MongoConnection.mongoQuery() Connected to Mongo to query collection: ' + collection);
	var cursor = dbConnection.collection(collection).find(JSON.parse(jsonString))
	cursor.toArray(function(err, jsonObjectsArray){
		callback(err, jsonObjectsArray)
	})

}




