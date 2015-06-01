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
    }

    callback(err, jsonString)
}

// Consistently set the Base URL
function setBaseURL(){
    return baseURL = 'http://' + config.getListenAddress() + ':' + config.getListenPort() + '/api/' + config.getVersion() + '/addressbook/'
}
