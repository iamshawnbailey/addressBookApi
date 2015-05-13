#!/usr/bin/env node

var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var mongoURL = 'mongodb://127.0.0.1:27017/';

exports.mongoOperation = function(operation, json, dbname, collection){
	if(operation == 'insert'){
		MongoClient.connect(mongoURL + dbname, function(err, db){
			console.log('Connected to MongoDB with URL: ' + mongoURL + collection);
			mongoInsert(db, json, collection, function(){
				console.log('Closing DB Connection');
				db.close()
			});
		})
	}else if(operation == 'query'){
		MongoClient.connect(mongoURL + collection, function(err, db){
			console.log('Connected to MongoDB with URL: ' + mongoURL + collection);
			mongoQuery(db, json, collection, function(result){
				db.close();
				return result;
			});
		})
	}
}

function mongoInsert(db, json, collection, callback){
	console.log('Connected to Mongo for insert with:' + json);
	db.collection(collection).insertOne(JSON.parse(json), function(err, result){
		assert.equal(err, null);
		console.log("Inserted a document into the restaurants collection.");
		callback(result);
	});
}


function mongoQuery(db, json, collection, callback){
	console.log('Connected to Mongo for query collection: ' + collection);
	callback('test');
}
