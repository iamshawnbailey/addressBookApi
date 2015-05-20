/**
 * Created by scbailey on 5/18/2015.
 */

var config = require('./ParseConfig')

var baseURL

exports.buildJsonString = function(resourceType, operation, jsonQueryString, collection, callback){

    if(baseURL == ''){
        baseURL = setBaseURL()
    }

    var err

    if(operation = 'query'){
        switch(resourceType) {
            case 'addressbook':
                jsonString = '{"name" : "' + collection + '"}'
        }
    }else if(operation = 'insert'){
        switch(resourceType) {
            case 'addressbook':
                jsonString = '{"name" : "' + collection + '","url" : "' + baseURL + collection + '" }'
        }
    }

    callback(err, jsonString)
}

function setBaseURL(){
    return baseURL = 'http://' + config.getListenAddress() + ':' + config.getListenPort() + '/api/' + config.getVersion() + '/addressbook/'
}
