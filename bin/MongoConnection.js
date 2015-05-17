#!/usr/bin/env node
//  TODO:  Get the return of the addressbook insert to only be the addressbook URL

var assert = require('assert');
var config = require('./ParseConfig')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var mongoURL
var dbConnection
var addressBooks = []
var addressBookExists = false

//  Entry point for the module that is called by addressBookOperations
exports.mongoOperation = function(resourceType, operation, jsonString, dbname, collection, callback) {

	//  Check if we already have a connection object available.  If not, create one and execute the operation.
	//  If we have one, use it for the operation
	//  callback to addressBookOperations with err or response payload
	if (dbConnection == null) {
		console.log('MongoConnection.mongoOperation() creating a new mongo connection')
		getConnection(dbname, function (err, dbConnection) {
			if (err) {
				console.log('MongoConnection.mongoOperation() DB Connection Error: ' + err.toString())
			}else{

				//  Load up the existing addressbooks from the addressbooks collection
				loadAddressBooks(dbConnection, function(err, addressBooks){
					console.log('MongoConnection.mongoOperation() receive addressBooks array with contents: ' + addressBooks.toString())

					//  Check whether the requested addressbook already exists in the addressbooks collection
					searchAndCreateAddressBook(addressBooks, collection, jsonString, function(err, result){
						if(!err){
							console.log('MongoConnection.mongoOperation()New DB Connection, calling selectOperation with operation: ' + operation)
							if(resourceType != 'addressbook') {
								selectOperation(operation, jsonString, dbname, collection, function (err, result) {
									if (!err) {
										callback(err, result)
									}
								})
							}else{
								callback(err, result)
							}
						}
					})
				})
			}
		})
	}else{
		console.log('MongoConnection.mongoOperation() using existing mongo connection')

		//  Have to search for the addressbook to see if it exists before calling selectOperation
		//  If the addressbook doesn't exist then we create it on the POST
		searchAndCreateAddressBook(addressBooks, collection, jsonString, function(err, result){
			if(!err) {
				console.log('MongoConnection.mongoOperation() calling selectOperation with operation: ' + operation)
				if(resourceType != 'addressbook') {
					selectOperation(operation, jsonString, dbname, collection, function (err, result) {
						callback(err, result)
					})
				}else{
					callback(err, result)
				}
			}
		})
	}
}


//  This function determines the operation to perform and calls the appropriate function
//  callback to mongoOperation with error or result
function selectOperation(operation, jsonString, dbname, collection, callback){

	console.log('MongoConnection.selectOperation()dbConnection equals: ' + dbConnection)

	if(operation == 'insert') {
		console.log('Connected to MongoDB with URL: ' + mongoURL + collection);
		mongoInsert(dbConnection, jsonString, collection, function (err, jsonString) {
			console.log('Closing DB Connection');
			//dbConnection.close()
			callback(err, jsonString)
		})
	}else if(operation == 'query'){
		MongoClient.connect(mongoURL + collection, function(err, db){
			console.log('Connected to MongoDB with URL: ' + mongoURL + collection);
			mongoQuery(db, jsonString, collection, function(result){
				//db.close();
				callback(result)
			});
		})
	}
}


//  Loads the addressbooks from the DB and populates the addressBooks array with the name values
function loadAddressBooks(db, callback){
	var cursor = db.collection('addressbooks').find()
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
function searchAndCreateAddressBook(addressBooks, collection, jsonString, callback){
	var error
	for(i=0; i<addressBooks.length; i++ ){
		if(addressBooks[i] == collection) {
			addressBookExists = true
		}
	}

	//  If the addressbook does not exist then add it to the addressbooks collection
	if(addressBookExists == false){
		console.log('MongoConnection.searchAndCreateAddressBook() creating a new Address Book with: ' + jsonString)
		insertAddressBook(dbConnection, jsonString, 'addressbooks', function(err, result){
			if(err){
				console.log('MongoConnection.searchAndCreateAddressBook() Error inserting new AddressBook: ' + err.toString())
				callback(err, result)
			}else{
				addressBooks.push(collection)
				callback(err, result)
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
			console.log('Getting Mongo Connection')
			dbConnection = db
			callback(err, dbConnection)
		}else{
			console.log('Error in MongoConnection.getConnection(): ' + err.toString())
			callback(err, dbConnection)
		}
	})
}


//  Handles all insert operations to the DB
function mongoInsert(db, jsonString, collection, callback){
	console.log('Connected to Mongo for insert with:' + jsonString);
	console.log('Inserting with JSON: ' + jsonString)
	db.collection(collection).insertOne(JSON.parse(jsonString), function(err, result){
		assert.equal(err, null);
		console.log("Inserted a document");
		callback(err, jsonString);
	});
}


//  Handles all query operations to the DB
function mongoQuery(db, jsonString, collection, callback){
	console.log('Connected to Mongo for query collection: ' + collection);
	callback('test');
}


//  Insert the new addressbook in the DB
//  addressbook records have a name and a URL
//  TODO:  Return only the addressbook URL in the callback
function insertAddressBook(db, jsonString, collection, callback){
	db.collection(collection).insertOne(JSON.parse(jsonString), function(err, result){
		assert.equal(err, null);
		console.log("MongoConnection.insertAddressBook() Inserted a new AddressBook: " + collection + '.' + jsonString);
		callback(err, jsonString)
	})
}
