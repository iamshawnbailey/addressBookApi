#!/usr/bin/env node

var assert = require('assert');
var config = require('./ParseConfig')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var mongoURL
var dbConnection
var addressBooks = []
var addressBookExists = false

//  Entry point for the module that is called by addressBookOperations
exports.mongoOperation = function(operation, json, dbname, collection, callback) {

	//  Check if we already have a connection object available.  If not, create one and execute the operation.
	//  If we have one, use it for the operation
	//  callback to addressBookOperations with err or response payload
	if (dbConnection == null) {
		getConnection(dbname, function (err, dbConnection) {
			if (err) {
				console.log('DB Connection Error: ' + err.toString())
			}else{

				//  Load up the existing addressbooks from the addressbooks collection
				loadAddressBooks(dbConnection, function(err, addressBooks){
					console.log('addressBooks: ' + addressBooks.toString())

					//  Check whether the requested addressbook already exists in the addressbooks collection
					searchAndCreateAddressBook(addressBooks, collection)

				})
			}
		})
	}else{

		searchAndCreateAddressBook(addressBooks, collection)
	}

	selectOperation(operation, json, dbname, collection, function(err, result){
		callback(err, result)
	})
}


//  This function determines the operation to perform and calls the appropriate function
//  callback to mongoOperation with error or result
function selectOperation(operation, json, dbname, collection, callback){

	console.log('mongoOperation connection: ' + dbConnection)

	if(operation == 'insert') {
		console.log('Connected to MongoDB with URL: ' + mongoURL + collection);
		mongoInsert(dbConnection, json, collection, function (err, json) {
			console.log('Closing DB Connection');
			//dbConnection.close()
			callback(err, json)
		})
	}else if(operation == 'query'){
		MongoClient.connect(mongoURL + collection, function(err, db){
			console.log('Connected to MongoDB with URL: ' + mongoURL + collection);
			mongoQuery(db, json, collection, function(result){
				//db.close();
				callback(result)
			});
		})
	}
}


function loadAddressBooks(db, callback){
	var cursor = db.collection('addressbooks').find()
	cursor.toArray(function(err, array){
		console.log('Cursor Array: ' + array.toString())
		callback(err, array)
	})

}


function searchAndCreateAddressBook(addressBooks, collection){

	for(i=0; i<addressBooks.length - 1; i++ ){
		if(addressBooks[i] == collection){
			addressBookExists = true
		}
	}

	//  If the addressbook does not exist then add it to the addressbooks collection
	if(addressBookExists == false){
		json = '{"name" : "' + collection +'"}'
		console.log('Creating a new Address Book with: ' + json)
		insertAddressBook(dbConnection, json, 'addressbooks', function(err, result){
			if(err){
				console.log('Error inserting new AddressBook: ' + err.toString())
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
function mongoInsert(db, json, collection, callback){
	console.log('Connected to Mongo for insert with:' + json);
	console.log('Inserting with JSON: ' + json)
	db.collection(collection).insertOne(JSON.parse(json), function(err, result){
		assert.equal(err, null);
		console.log("Inserted a document");
		callback(err, json);
	});
}


//  Handles all query operations to the DB
function mongoQuery(db, json, collection, callback){
	console.log('Connected to Mongo for query collection: ' + collection);
	callback('test');
}


function insertAddressBook(db, json, collection, callback){
	db.collection(collection).insertOne(JSON.parse(json), function(err, result){
		assert.equal(err, null);
		console.log("Inserted a new AddressBook: " + collection);
		callback(err, json);
	});
}
