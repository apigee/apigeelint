 ///////////////////////
//// in future releaes consider adding CORS as part of the specs checks by adding options to the specs.
////////////////////////

/* -----------------------------------------------------------------------
 * 0. Retrieve properties from JavaScript policy and get current flow name
 *    Validate inputs that the script would be using for validating incoming
 *    request
 * -----------------------------------------------------------------------
 */

// 0.1 retrieve properties from JS-ValidateAndSanitizeRequest policy

var validateRequestPath = properties.validateRequestPath; // Returns validateRequestPath
var validateRequestQueryParameters = properties.validateRequestQueryParameters; // Returns validateRequestQueryParameters
var validateRequestHeaders = properties.validateRequestHeaders; // Returns validateRequestHeaders
var validateRequestCookie = properties.validateRequestCookie; // Returns validateRequestCookie
var validateRequestBody = properties.validateRequestBody; // Returns validateRequestBody
var validateCORS = properties.validateCORS; // Returns validateCORS

// 0.2 Verify that properties are set correctly
if(!validateRequestPath || !validateRequestQueryParameters || !validateRequestHeaders || !validateRequestCookie || !validateRequestBody){
    createError("500", "MissingVariable", " One of the ValidateAndSanitizeRequest policy properties is missing", "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
}else{
 //   do nothing
}

/* 0.3 retrieve current.flow.name
 * the current.flow.name is used to match operationId inside the OpenAPI Specs and get the details of what to expect
 * in the request. For the ValidateAndSanitizeRequest to work, the current.flow.name must match one of the operationId
 * in the OpenAPi Specs.
 */
var flowname = context.getVariable('current.flow.name');

print("0.3 flowname:- " + flowname);
// 0.4 validate oas3 variable which is set in oas3.js
if(typeof oas3 === 'undefined'){
    createError("400", "MissingOas3", " oas3 variable is not defined in oas3.js, please export JSON version of this proxy's OpenAPI Specifications and add it in oas3.js as: var oas3 = YOUR_JSON_EXPORT_OF_OAS;", "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
}else if(!oas3){
    createError("400", "MissingOas3", " oas3 variable value in oas3.js is null or empty, please export JSON version of this proxy's OpenAPI Specifications and add it in oas3.js as: var oas3 = YOUR_JSON_EXPORT_OF_OAS;", "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
}else{
    if(oas3.constructor !== ({}).constructor){
        createError("400", "BadOas3Format", " oas3 variable value in oas3.js is not in the correct format. The value needs to be JSON export of this proxy's OpenAPI Specifications", "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
    }
}


/* --------------------------------------------
 * 1. Validate Request Path and it's Parameters
 * --------------------------------------------
 */

if(validateRequestPath == "true"){
    try{
        var messageExpectedPathRegularExpression = getMessageExpectedPathRegularExpression( flowname );
        print("1 messageExpectedPathRegularExpression:- " + messageExpectedPathRegularExpression);
        //check if a matching operationId found in the OpenAPI Specs and if not raise an error.
        if(messageExpectedPathRegularExpression === undefined){
            createError("400", "Oas3OperationIdNotFound", "Invalid OAS3 file." + " OAS3 Parameter operationId for path " + context.getVariable("request.path") + " and verb " + context.getVariable("request.verb") + " need to match your apigee flow name. current apigee flow name is: " + flowname, "apigeePolicy", "validateAndSanitizeRequest commonFunctions.js and oas3.js");
        }
        if(!(new RegExp(messageExpectedPathRegularExpression)).test(context.getVariable("request.path").trim())){
            createError("400", "InvalidRequestPath", "Bad Request: request path: " + context.getVariable("request.path").trim() + " is invalid. It doesn't match Regular Expression: " + messageExpectedPathRegularExpression, "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
        }
    }catch(err){
        if(err.message.match(/^(Oas3OperationIdNotFound|InvalidRequestPath)$/)){
            throw err;
        }else{
            createError("500", "ValidateRequestPathUnknownError", JSON.stringify(err), "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
        }
    }
}

/* ----------------------------------------
 * 2. Validate and sanitize Request Headers
 * ----------------------------------------
 */

if(validateRequestHeaders == "true"){
    try {
        var messageExpectedHttpHeaders = getMessageExpectedHttpHeaders( flowname );
         print("2 messageExpectedHttpHeaders:- " + messageExpectedHttpHeaders);
         messageExpectedHttpHeaders.push({"name":"Content-Type", "required": false,"schema":{"pattern":"^application/json$"}});
        messageExpectedHttpHeaders.push({"name":"Content-Length", "required": false, "schema":{"pattern":"^[0-9]{1,6}$"}});
       messageExpectedHttpHeaders.push({"name":"Origin", "required": true, "schema":{"pattern":"^(https\:\/\/[a-z0-9\-\.]{5,70})$"}});
        messageExpectedHttpHeaders.push({"name":"Cookie", "required": false, "schema":{"pattern":"^(.+?)(?:=(.+?))?(?:;|$|,(?!\s))$"}});


        for (var i=0; i < messageExpectedHttpHeaders.length;i++){
            
            print("2.2 messageExpectedHttpHeaders :- " + i + messageExpectedHttpHeaders[i].name);
            
            validateRequestHeader("request.header." + messageExpectedHttpHeaders[i].name.toLowerCase(),
                                  messageExpectedHttpHeaders[i].schema.pattern,
                                  messageExpectedHttpHeaders[i].required);
        }
        if(context.getVariable('request.headers.count') > 0){
            sanitizeRequestHeaders(messageExpectedHttpHeaders);
        }
    }catch( err ) {
        if(err.message.match(/^(InvalidRequestHeader)$/)){
            throw err;
        }else{
            createError("500", "RequestHeadersCheckUnknownError", JSON.stringify(err), "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
        }
    }
}

/* ----------------------------------------
 * 3. Validate Request Query Parameters
 * ----------------------------------------
 */

if(validateRequestQueryParameters == "true"){
    try {
        var messageExpectedQueryParameters = getMessageExpectedQueryParameters (flowname);
        for (var i=0; i < messageExpectedQueryParameters.length;i++){
            validateRequestQueryParameter("request.queryparam." + messageExpectedQueryParameters[i].name,
                                  messageExpectedQueryParameters[i].schema.pattern,
                                  messageExpectedQueryParameters[i].required);
        }
        if(context.getVariable('request.queryparams.count') > 0){
            sanitizeRequestQueryParameters(messageExpectedQueryParameters);
        }
    }catch( err ) {
        if(err.message.match(/^(invalidRequestQueryParameter)$/)){
            throw err;
        }else{
            createError("500", "RequestQueryParametersCheckUnknownError", JSON.stringify(err), "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
        }
    }
}

/* ----------------------------------------
 * 4. Validate Request Cookie Parameters
 * ----------------------------------------
 */

if(validateRequestCookie == "true"){
    try {
        var requestCookieParameters = requestCookieToArray();
        var messageExpectedCookieParameters = getMessageExpectedCookieParameters (flowname);
        for (var requestI=0; requestI < requestCookieParameters.length;requestI++){
            for (var expectedI=0; expectedI < messageExpectedCookieParameters.length;expectedI++){
                if(requestCookieToArray[requestI].name == messageExpectedCookieParameters[expectedI].name){
                    validateRequestCookieParameter(requestCookieParameters[requestI].name.toLowerCase(),
                                  messageExpectedCookieParameters[expectedI].schema.pattern,
                                  messageExpectedCookieParameters[expectedI].required);
                }

            }
        }
        if(requestCookieParameters){
            if(requestCookieParameters.length > 0){
                newRequestCookieParameters = sanitizeRequestCookieParameters(messageExpectedCookieParameters, requestCookieParameters);
                // sanitize by setting the values that are known based on the OpenAPI Specs.
                setRequestCookieHeader(newRequestCookieParameters);
                //print("New Cookie parameters " + JSON.stringify(newRequestCookieParameters));
            }
        }
    }catch( err ) {
        if(err.message.match(/^(invalidRequestCookieParameter)$/)){
            throw err;
        }else{
            createError("500", "unknownError", JSON.stringify(err), "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
        }
    }
}

/* ----------------------------------------
 * 5. Validate Request body/payload
 * ----------------------------------------
 */

if(validateRequestBody == "true"){
    try{
        var verb = context.getVariable('request.verb');
        var pathsuffix = context.getVariable('proxy.pathsuffix');
        // get expected JSON Payload Schema
        var schema = getMessageSchema( flowname );

        var requestContent = context.getVariable('request.content');

        var requestContentLength = 0;
        // get request content length
        if(!requestContent){
            requestContentLength = 0;
            //print ("requestContent = 0");
        }else{
            requestContentLength = context.getVariable('request.content').length;
        }
        // if schema is not defined in oas3 file and request received has content
        if((schema === undefined || schema === null) && (requestContentLength > 0)) {
            //throw "Missing schema definition for: " + verb + " " + pathsuffix;
            createError("400", "invalidRequestPayload", "Bad Request: Invalid Payload for: " + verb + " " + pathsuffix + ", request payload is not null", "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
            // if schema is not defined in oas3 file and request recieved has no content
        }else if((schema === undefined || schema === null) && (requestContentLength === 0)){
            // do nothing because it is a get/Delete request as per OAS which has no payload
            // and requestor did not send a payload so all good move on to next policy
        // if schema defined in oas3 file and request recieved has  content then do the schema match
        }else{
            var body = JSON.parse(requestContent);

            // Add the OAS as a schema
            tv4.addSchema('/schema', oas3);

            // Validate the request and stop on the first error
            // here you can use also validateMultiple and it would validate everything
            // then error back all errors in result.errors rather than result.error
            var result = tv4.validateMultiple(body, schema);
            //print("Validation result: " + JSON.stringify(result));


            // A missing schema validates to true, but we want that to be an error
            // Override missing entry with full schema value
            if( result.missing[0] ) {
                result.errors[0] = {"schema":schema};
                //throw "Schema definition not found" + JSON.stringify(result.errors);
                createError("400", "invalidRequestPayload", "Schema definition not found: " + JSON.stringify(result.errors), "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
            }
            else if( result.valid === false ) {
                //throw "Validation failed for: " + verb + " " + pathsuffix + ": " + JSON.stringify(result.errors);
                createError("400", "invalidRequestPayload", JSON.stringify(result.errors), "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
            }
        }
    }catch( err ) {

        // check if JSON Payload is invalid
        if(err.message.includes("Unexpected token:") || err.message.includes("Expected end of stream at char") || err.message.includes("Empty JSON")){
            createError("400", "invalidRequestPayload", JSON.stringify(err), "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
        }else if(!err.includes("invalidRequestPayload")){
                createError("500", "unknownError", JSON.stringify(err), "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
        }
    }
}
