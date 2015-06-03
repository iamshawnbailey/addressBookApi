/**
 * Created by scbailey on 5/18/2015.
 */

var config = require('./ParseConfig')

var baseURL
var jsonString

exports.buildJsonString = function(resourceType, operation, req, jsonQueryString, collection, callback){

    var err

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
