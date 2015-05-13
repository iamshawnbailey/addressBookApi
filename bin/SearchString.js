#!/usr/bin/env node

var queryString = require('querystring');

exports.getSearchString = function(parsedURL){
		if(parsedURL.search != null){
			var searchString = parsedURL.search.toString();
			searchString = searchString.substr(1, searchString.length + 1);
			return searchString
		}else return false;
	}

exports.getQueryStringValues = function(searchString){
	
	var query = queryString.parse(searchString);
	var values = [];
	values.push(JSON.stringify(query));
	
	return values;
	
	}
