The purpose of this file is to document the use of the definition files contained in this directory.

All index or length values are 0 based.

jsonstring_definitions.json:
/*
The purpose of this file is to define the JSON strings that are created for the various requests that the API can accept.
These JSON strings are used for DB operations and HTTP responses

record:  Encapsulates the combination of HTTP method and resource type
Each 'record' constists of the following:
method:  The HTTP verb of the request
resourcetype:  The type of resource the request is for.  Resource types are defined in router_definitions.json and are loaded when the request is processed
in the router.
parameters:  These are the parameters that are needed to build the JSON string for DB operations and HTTP responses

The parameters will typically include a URL for the resource and this type of parameter may need a variety values in order to build the URL
To handle this there is a 'path' parameter type that is an array of JSON objects that have the following attributes:
value:  The value of the path parameter
source:  The source of the value which can be this file, the request path or the request body


path entries:
// Most of the generated URLs will include a combination of consistent values and dynamic values
// If consistent then the 'source' is 'this', if it comes from the request path then 'path' and if the req body then 'body'
*/


router_definitions.xml:
/*
The purpose of this file is to separate request routing from the specific values appropriate for the API.

All API specific values should be specified here so that the code itself can remain agnostic to the particular API it's used for.

pathroot:  The root resource of the API and perhaps the name of the DB instance it uses
routes:  Contain all of the information needed to accurately route the request for fulfillment.  It includes:

pathlength:  How long the corresponding request path is for this route (1 based)
pathname:  The most specific resource that the path is requesting (commonly plural like what is used in the path)
resourcetype:  The type of the resource that the request is specifying (typcially singular)
querystring:  Is a query string applicable (never required)
links:  An array of JSON objects that define the 'links' HTTP response attribute.  Contains:

name: The 'rel' name of the link
path: The partial path string to be used.

*/
