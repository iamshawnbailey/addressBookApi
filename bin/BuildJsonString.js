/**
 * Created by scbailey on 5/18/2015.
 */

var fs = require('fs')
var config = require('./ParseConfig')

var jsonDefinitionsObject
var recordObjectArray = []
var recordObjectHash = new Object()
var recordOjbect
var baseURL
var jsonString
var testJsonString = '{"'

//  Load the MongoDB connection values from the config.json file
fs.readFile('jsonstring_definitions.json', function(err, data){
    console.log('BuildJsonString().readFile() jsonstring_definitions.json data: ' + data)
    jsonDefinitionsObject = JSON.parse(data)
    recordObjectArray = jsonDefinitionsObject.records

    // load the records into a hash using a concatenation of the HTTP verb and resourcetype as the key
    for(i=0; i<recordObjectArray.length; i++){
        recordObjectHash[recordObjectArray[i].method + recordObjectArray[i].resourcetype] = recordObjectArray[i]
    }

    console.log('BuildJsonString.readFile() Record Object Hash: ' + recordObjectHash)

    if(err){
        console.log('BuildJsonString.readFile() Error reading jsonstring_definitions.json: ' + err)
    }

})

exports.buildJsonString = function(resourceType, operation, req, jsonQueryString, collection, callback){

    var err

    // create the hashkey from the input parameters
    var hashKey = operation + resourceType
    console.log('BuildJsonString.buildJsonString() Hash Key: ' + hashKey)

    // Retrieve the record object with the hashkey.  If it doesn't exist then we'll populate err
    recordObject = recordObjectHash[hashKey]

    //  If the record object could be found with the hash key then we loop through its parameters to build the JSON string
    if(recordObject){
        for(i=0; i<recordObject.parameters.length; i++){
            console.log('BuildJsonString.buildJsonString() Record Object: ' + JSON.stringify(recordObject))
            testJsonString = testJsonString + recordObject.parameters[i].name + '" : "'

            // Some parameters require runtime values while the rest will have the values specified in the definitions file
            switch(recordObject.parameters[i].value){
                case 'collection':
                    testJsonString = testJsonString + collection
                    break
                case 'url':
                    testJsonString = testJsonString + setBaseURL() + collection
                    break
                default:
                    testJsonString = testJsonString + recordObject.parameters[i].value
                    break
            }

            if(i == recordObject.parameters.length - 1){
                testJsonString = testJsonString + '"}'
            }else{
                testJsonString = testJsonString + '", "'
            }

        }
    }else(
        err = 'No matching record found in jsonstring_definitions'
    )


    console.log('BuildJsonString().buildJsonString() Value of Test JSON String: ' + testJsonString)

    if(operation == 'get'){
        switch(resourceType) {
            case 'addressbook':
                jsonString = '{"name" : "' + collection + '"}'
                break
        }
    }else if(operation == 'post'){
        switch(resourceType) {
            case 'addressbook':
                jsonString = '{"name" : "' + collection + '","url" : "' + setBaseURL() + collection + '" }'
                break
            case 'group':
                console.log('BuildJsonString.buildJsonString() building string for group post: ' + JSON.stringify(req.body))
                jsonString = '{"recordtype" : "group", "name" : "' + req.body.name + '", "members" : "' + req.body.members + '", "url" : "' + setBaseURL() + collection + '/groups/' + req.body.name + '"}'
                console.log('BuildJsonString.buildJsonString() json string from group post is: ' + jsonString)
                break
        }
    }else if(operation == 'delete'){
        switch(resourceType){
            case 'addressbook':
                jsonString = '{"name" : "' + collection + '"}'
                break
        }
    }else if(operation == 'error'){
        console.log('BuildJsonString.buildJsonString() Error string being built with error code: ' + req.code)
        switch(req.code){
            case 11000:
                var action = 'Addressbook name already exists.  Please choose a different value'
                jsonString = '{"errorcode" : "' + req.code + '", "description" : ' + JSON.stringify(req.message) + ', "correctiveaction" : "' + action + '"}'
                break
            case 1234:
                console.log('BuildJsonString.buildJsonString() Error Case 1234')
                var action = 'Create the resource'
                jsonString = '{"errorcode" : "' + req.code + '", "description" : ' + JSON.stringify(req.message) + ', "correctiveaction" : "' + action + '"}'
                break
        }

    }

    callback(err, jsonString)
}

// Consistently set the Base URL
function setBaseURL(){
    return baseURL = 'http://' + config.getListenAddress() + ':' + config.getListenPort() + '/api/' + config.getVersion() + '/addressbook/'
}
