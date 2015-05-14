#!/usr/bin/env node

var fs = require('fs')
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var mongoURL

//  Load the MongoDB connection values from the config.json file
fs.readFile('config.json', function(err, data){
	console.log('config.json data: ' + data)
	var configJSON = JSON.parse(data)
	mongoURL = 'mongodb://' + configJSON.mongohost + ':' + configJSON.mongoport + '/'
	console.log('mongo URL: ' + mongoURL)
	if(err){
		console.log('Error reading config.json from MongoConnection: ' + err)
	}

})


exports.mongoOperation = function(operation, json, dbname, collection, callback){
	if(operation == 'insert'){
		MongoClient.connect(mongoURL + dbname, function(err, db){
			console.log('Connected to MongoDB with URL: ' + mongoURL + collection);
			mongoInsert(db, json, collection, function(err, json){
				console.log('Closing DB Connection');
				db.close()
				callback(err, json)
			});
		})
	}else if(operation == 'query'){
		MongoClient.connect(mongoURL + collection, function(err, db){
			console.log('Connected to MongoDB with URL: ' + mongoURL + collection);
			mongoQuery(db, json, collection, function(result){
				db.close();
				callback(result)
			});
		})
	}
}

function mongoInsert(db, json, collection, callback){
	console.log('Connected to Mongo for insert with:' + json);
	console.log('Inserting with JSON: ' + json)
	db.collection(collection).insertOne(JSON.parse(json), function(err, result){
		assert.equal(err, null);
		console.log("Inserted a document");
		callback(err, json);
	});
}


function mongoQuery(db, json, collection, callback){
	console.log('Connected to Mongo for query collection: ' + collection);
	callback('test');
}
