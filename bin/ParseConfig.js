/**
 * Created by scbailey on 5/14/2015.
 */

var fs = require('fs')
var listenAddress
var listenPort
var mongoHost
var mongoPort
var version
var debug

//  Load the MongoDB connection values from the config.json file
fs.readFile('config.json', function(err, data){
    console.log('config.json data: ' + data)
    var configJSON = JSON.parse(data)
    listenAddress = configJSON.listenaddress
    listenPort = configJSON.listenport
    mongoHost = configJSON.mongohost
    mongoPort = configJSON.mongoport
    version = configJSON.version
    debug = configJSON.debug

    if(err){
        console.log('Error reading config.json from MongoConnection: ' + err)
    }

})

exports.getBaseUrl = function(){
    return 'http://' + listenAddress + ':' + listenPort + '/api/' + version + '/addressbooks/'
}

exports.getListenAddress = function(){
    console.log('getListenAddress; ' + listenAddress)
    return listenAddress
}

exports.getListenPort = function(){
    return listenPort
}

exports.getMongoHost = function(){
    return mongoHost
}

exports.getMongoPort = function(){
    return mongoPort
}

exports.getVersion = function(){
    return version
}

exports.getDebug = function(){
    return debug
}
