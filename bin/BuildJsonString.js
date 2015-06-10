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
var pathArray
var testJsonString = '{"'

//  Load the MongoDB connection values from the config.json file
fs.readFile('./definitions/jsonstring_definitions.json', function(err, data){
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



    if(operation == 'get'){
        switch(resourceType) {
            case 'addressbook':
                jsonString = '{"name" : "' + collection + '"}'
                break
        }

        /*
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
        */
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


    // create the hashkey from the input parameters
    var hashKey = operation + resourceType
    console.log('BuildJsonString.buildJsonString() Hash Key: ' + hashKey)

    // Retrieve the record object with the hashkey.  If it doesn't exist then we'll populate err
    recordObject = recordObjectHash[hashKey]

    //  If the record object could be found with the hash key then we loop through its parameters to build the JSON string
    if(recordObject){
        jsonString = '{"'

        //  Loop through the parameters of the recordObject to build the JSON string
        //  This string is used for all DB operations
        for(i=0; i<recordObject.parameters.length; i++){
            console.log('BuildJsonString.buildJsonString() Record Object: ' + JSON.stringify(recordObject))
            jsonString = jsonString + recordObject.parameters[i].name + '" : "'

            // Some parameters require runtime values while the rest will have the values specified in the definitions file
            switch(recordObject.parameters[i].value){

                //  If the parameter is of type 'collection' then we're probably getting an addressbook
                case 'collection':
                    jsonString = jsonString + collection
                    break

                //  The 'url' is the URL value that is stored in the DB for the record of interest.
                    //  We build the value based on the definition and this value can be used for any DB operation
                case 'url':
                    jsonString = jsonString + setBaseURL() + collection

                    //  This is to build the full path for the resource URL
                    //  Value can come from the request body, request path or the definitions file
                    if(recordObject.parameters[i].path){
                        for(y=0; y<recordObject.parameters[i].path.length; y++){
                            if(recordObject.parameters[i].path[y].source == 'body'){
                                jsonString = jsonString + '/' + req.body[recordObject.parameters[i].path[y].value]
                            }else if(recordObject.parameters[i].path[y].source == 'path') {
                                jsonString = jsonString + '/' + req.path.toString().split('/')[recordObject.parameters[i].path[y].index]
                            }else{
                                jsonString = jsonString + '/' + recordObject.parameters[i].path[y].value
                            }
                        }
                    }

                    break

                //  The parameter value is in the request body so we'll retrieve it from there
                case 'body':
                    jsonString = jsonString + req.body[recordObject.parameters[i].name]
                    break

                //  The parameter is of type 'path' so we need to just pull the value from the request path at the specified index
                case 'path':
                    jsonString = jsonString + req.path.toString().split('/')[recordObject.parameters[i].index]
                    break
                default:
                    jsonString = jsonString + recordObject.parameters[i].value
                    break
            }

            if(i == recordObject.parameters.length - 1){
                jsonString = jsonString + '"}'
            }else{
                jsonString = jsonString + '", "'
            }

        }
    }


    console.log('BuildJsonString().buildJsonString() Value of JSON String: ' + jsonString)

    callback(err, jsonString)
    jsonString = ''
}

// Consistently set the Base URL
function setBaseURL(){
    return baseURL = 'http://' + config.getListenAddress() + ':' + config.getListenPort() + '/api/' + config.getVersion() + '/addressbook/'
}
