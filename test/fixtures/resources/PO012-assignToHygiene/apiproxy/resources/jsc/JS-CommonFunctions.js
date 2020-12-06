 function setFormatAsRegex(httpPathParametersArrayItem) {
    if(httpPathParametersArrayItem.schema.pattern === undefined && httpPathParametersArrayItem.schema.format !== undefined) {
        switch (httpPathParametersArrayItem.schema.format) {
            case 'int32':
            case 'int64':
                httpPathParametersArrayItem.schema.pattern = '\\d+';
                break;
            case 'float':
            case 'double':
                httpPathParametersArrayItem.schema.pattern = '^\-?\\d+\.\\d+$';
                break;
            case 'date':
                httpPathParametersArrayItem.schema.pattern = '\\d{4}-\\d{2}-\\d{2}';
                break;
            case 'date-time':
                httpPathParametersArrayItem.schema.pattern = '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:.\\d+)?[A-Z]?(?:[+.-](?:\\d{2}:\\d{2}|\\d{2}[A-Z]))?$';
                break;
            default:
                httpPathParametersArrayItem.schema.pattern = '.+';
        }
    }
}

function getMessageExpectedPathRegularExpression( flowname ) {
    // Find the operationId that matches the flowname
    // Return the schema from the parameter that is "in" "body".
    var httpPathParametersArray = [];
    var pathRegularExpression = "";
    var paths = oas3.paths;
    for ( var path in paths ) {
        var verbs = paths[path];
        for( var verb in verbs ) {
            if( verbs[verb].operationId === flowname ) {
                var params = verbs[verb].parameters;
                for ( var param in params ) {
                    if( params[param].hasOwnProperty( 'in' ) && params[param].in === 'path' ) {
                        //return params[param];
                        httpPathParametersArray.push(params[param]);
                    }
                }
                pathRegularExpression = path;
                for (var i=0; i < httpPathParametersArray.length;i++){
                    setFormatAsRegex(httpPathParametersArray[i]);
                    if(httpPathParametersArray[i].required === undefined || httpPathParametersArray[i].name === undefined || httpPathParametersArray[i].schema.pattern === undefined){
                        createError("400", "MissingVariable", "Invalid OAS3 file" + " OAS3 Parameters required elements required, name, or schema pattern is missing: " + httpPathParametersArray[i] , "apigeePolicy", "validateAndSanitizeRequest commonFunctions.js and oas3.js");
                    }
                    if(httpPathParametersArray[i].required){
                        pathRegularExpression = pathRegularExpression.replace("{" + httpPathParametersArray[i].name + "}", httpPathParametersArray[i].schema.pattern.replace(/^\^/g, "").replace(/\$$/g, "")).replace(/\//g, "\/");
                    }
                }
                pathRegularExpression = pathRegularExpression + "(/)?";
                //print("pathRegularExpression: " + pathRegularExpression);
                //httpPathParametersArray = {"path":path,"pathRegularExpression": pathRegularExpression,"parameters":httpPathParametersArray};
                return pathRegularExpression;
            }
        }
    }
    return undefined;
}

function getMessageExpectedQueryParameters( flowname ) {
    // Find the operationId that matches the flowname
    // Return the schema from the parameter that is "in" "body".
    var queryParametersArray = [];
    var paths = oas3.paths;
    for ( var path in paths ) {
        var verbs = paths[path];
        for( var verb in verbs ) {
            if( verbs[verb].operationId === flowname ) {
                var params = verbs[verb].parameters;
                for ( var param in params ) {
                    if( params[param].hasOwnProperty( 'in' ) && params[param].in === 'query' ) {
                        //return params[param];
                        queryParametersArray.push(params[param]);
                    }
                }
                return queryParametersArray;
            }
        }
    }
    return undefined;
}

function getMessageExpectedCookieParameters( flowname ) {
    // Find the operationId that matches the flowname
    // Return the schema from the parameter that is "in" "body".
    var cookieParametersArray = [];
    var paths = oas3.paths;
    for ( var path in paths ) {
        var verbs = paths[path];
        for( var verb in verbs ) {
            if( verbs[verb].operationId === flowname ) {
                var params = verbs[verb].parameters;
                for ( var param in params ) {
                    if( params[param].hasOwnProperty( 'in' ) && params[param].in === 'cookie' ) {
                        //return params[param];
                        cookieParametersArray.push(params[param]);
                    }
                }
                return cookieParametersArray;
            }
        }
    }
    return undefined;
}

function getMessageExpectedHttpHeaders( flowname ) {
    // Find the operationId that matches the flowname
    // Return the schema from the parameter that is "in" "body".
    var httpHeadersArray = [];
    var paths = oas3.paths;
    for ( var path in paths ) {
        var verbs = paths[path];
        for( var verb in verbs ) {
            if( verbs[verb].operationId === flowname ) {
                // 1. Get explicitly specified headers
                var params = verbs[verb].parameters;
                for ( var param in params ) {
                    if( params[param].hasOwnProperty( 'in' ) && params[param].in === 'header' ) {
                        //return params[param];
                        httpHeadersArray.push(params[param]);
                    }
                }
                //2. Get implicitly specified headers
                var securitySchemes = verbs[verb].security;
                if(securitySchemes){
                    for ( var securityScheme in securitySchemes) {
                        if(securitySchemes[securityScheme].hasOwnProperty('BasicAuth')) {
                            httpHeadersArray.push({"name":"Authorization", "required": true, "schema":{"pattern":"^Basic [A-Za-z0-9\\+=]{5,70}$"}});
                       }else if(securitySchemes[securityScheme].hasOwnProperty('BearerAuth')){
                            httpHeadersArray.push({"name":"Authorization", "required": true, "schema":{"pattern":"^Bearer [A-Za-z0-9\-\._~\+\/ ]+=*$"}});
                       }else if(securitySchemes[securityScheme].hasOwnProperty('ApiKeyAuth')){
                            httpHeadersArray.push({"name":"X-API-Key", "required": true, "schema":{"pattern":"^[a-zA-Z-0-9]{32}$"}});
                       }
                   }
                }
                return httpHeadersArray;
            }
        }
    }
    return undefined;
}

function sanitizeRequestHeaders( messageExpectedHttpHeaders ) {
    //Most important : request.headers.names give a Java Set object so convert it to string array.
    //add more headers
    var requestHttpHeaderNames = context.getVariable('request.headers.names');
    requestHttpHeaderNames = requestHttpHeaderNames.toArray();
    var matchFound = false;

    for (var i = 0; i < requestHttpHeaderNames.length; i++) {
            matchFound = false;
            for (var x = 0; x < messageExpectedHttpHeaders.length; x++) {
               if(requestHttpHeaderNames[i].toLowerCase() == messageExpectedHttpHeaders[x].name.toLowerCase()){
                    matchFound = true;
                    break;
               }
            }
            if(!matchFound){
                context.removeVariable('request.header.'+ requestHttpHeaderNames[i]);
               /* if(context.getVariable("api.custom.log") === null || context.getVariable("api.custom.log") === ""){
                    context.setVariable("api.custom.log", '"proxyRequestHeadersModified":"true"');
                    context.setVariable("api.custom.log", context.getVariable("api.custom.log") + ',"proxyRequestHeadersModifiedBy":"apigee ValidateAndSanitizeRequest Policy"');
                }else if(!context.getVariable("api.custom.log").includes("proxyRequestHeadersModified")){
                        context.setVariable("api.custom.log", context.getVariable("api.custom.log") + ',"proxyRequestHeadersModified":"true"');
                        context.setVariable("api.custom.log", context.getVariable("api.custom.log") + ',"proxyRequestHeadersModifiedBy":"apigee ValidateAndSanitizeRequest Policy"');
                }*/
            }
    }
}

function getMessageSchema( flowname ) {
    // Find the operationId that matches the flowname
    // Return the schema from the parameter that is "in" "body".
    var paths = oas3.paths;
    for ( var path in paths ) {
        var verbs = paths[path];
        for( var verb in verbs ) {
            if( verbs[verb].operationId === flowname ) {
                var requestBody = verbs[verb].requestBody;
                if ( requestBody ) {
                    var content;
                    if( requestBody.content) {
                        content = requestBody.content;
                    }
                    if( requestBody['$ref'] ) {
                        var ref = requestBody['$ref'];
                        var schemaName = ref.split('/')[3];
                        content = oas3.components.requestBodies[schemaName].content;
                    }
                    if( content && content['application/json'] ) {
                        return content['application/json'].schema;
                    }
                }
            }
        }
    }
    return undefined;
}

function requestCookieToArray() {
    var cookieHeaderStr = context.getVariable("request.header.Cookie");
    var cookieNameValueArray = [];
    if(cookieHeaderStr){
        var cookieArray = cookieHeaderStr.split("; ");
        for (var i=0; i < cookieArray.length;i++){
            // some cookies would include = in its value. to overcome this problem
            // we would use the RE "=(.+)"
            var nameValue = cookieArray[i].split(/=(.+)/);
            var cName =  nameValue[0];
            var cValue = nameValue[1];
            cookieNameValueArray.push({name: cName , value: cValue});
        }
    }
    return cookieNameValueArray;
}

function setRequestCookieHeader(newRequestCookieParameters) {
    var cookieHeaderStr = "";
    for(i=0;i < newRequestCookieParameters.length; i++){
        cookieHeaderStr = cookieHeaderStr + newRequestCookieParameters[i].name + "=" + newRequestCookieParameters[i].value;
    }
    context.setVariable("request.header.Cookie", cookieHeaderStr);
    /*if(context.getVariable("api.custom.log") === null || context.getVariable("api.custom.log") === ""){
        context.setVariable("api.custom.log", '"proxyRequestCookieHeaderModified":"true"');
        context.setVariable("api.custom.log", context.getVariable("api.custom.log") + ',"proxyRequestCookieHeaderModifiedBy":"apigee ValidateAndSanitizeRequest Policy"');
    }else if(!context.getVariable("api.custom.log").includes("proxyRequestCookieHeaderModified")){
        context.setVariable("api.custom.log", context.getVariable("api.custom.log") + ',"proxyRequestCookieHeaderModified":"true"');
        context.setVariable("api.custom.log", context.getVariable("api.custom.log") + ',"proxyRequestCookieHeaderModifiedBy":"apigee ValidateAndSanitizeRequest Policy"');
    }*/
}

function validateRequestHeader(requestHeader, regularExpressionToMatch, requiredFlag) {
    // if the madatory header does not exist, error
    // and if it does check against regular expression
    headerValuesString = "";
    if(context.getVariable(requestHeader + ".values.count") > 1){
        headerValuesString = getHeaderValuesAsString(requestHeader.trim());
    }else{
        headerValuesString = context.getVariable(requestHeader.trim());
    }
    if(requiredFlag === true){
        //print (requestHeader + ":" + context.getVariable(requestHeader));
        if(context.getVariable(requestHeader) === null){
            createError("400", "InvalidRequestHeader", "Bad Request: required " + requestHeader + " does not exist" , "apigeePolicy", "validateAndSanitizeRequest commonFunctions.js");
        }else{
            if(!(new RegExp(regularExpressionToMatch)).test(headerValuesString)){
                createError("400", "InvalidRequestHeader", "Bad Request: required " + requestHeader + " header is invalid when matched with regular expression: " + regularExpressionToMatch, "apigeePolicy", "validateAndSanitizeRequest commonFunctions.js");
            }
        }
    }else{
         //print (requestHeader + ":" + context.getVariable(requestHeader));
        // do the regular expression match only if the optional header exists
        if(context.getVariable(requestHeader) === null){
          // do nothing as it is optional field
        }else{
            //print ("in header exist and evaluation of RE: " + context.getVariable(requestHeader).match(regularExpressionToMatch));

            if(!(new RegExp(regularExpressionToMatch)).test(headerValuesString)){
                createError("400", "InvalidRequestHeader", "Bad Request " + requestHeader + " header is invalid when matched with regular expression: " + regularExpressionToMatch , "apigeePolicy", "validateAndSanitizeRequest commonFunctions.js");
                //print ("evaluation failed");
            }
        }
    }
}

function getHeaderValuesAsString(requestHeader){
    headerValues = "";
    for (var i = 1; i <=context.getVariable(requestHeader + ".values.count"); i++){
        headerValues = headerValues + context.getVariable(requestHeader + "." + i) + ",";
    }
    headerValues = headerValues.slice(0, -1)
    return headerValues;
}

function sanitizeRequestQueryParameters( messageExpectedQueryParameters ) {
    //Most important : request.headers.names give a Java Set object so convert it to string array.
    //add more headers
    var requestQueryParameters = context.getVariable('request.queryparams.names');
    requestQueryParameters = requestQueryParameters.toArray();
    var matchFound = false;

    for (var i = 0; i < requestQueryParameters.length; i++) {
            matchFound = false;
            for (var x = 0; x < messageExpectedQueryParameters.length; x++) {
               if(requestQueryParameters[i].toLowerCase() == messageExpectedQueryParameters[x].name.toLowerCase()){
                    matchFound = true;
                    break;
               }
            }
            if(!matchFound){
                context.removeVariable('request.queryparam.'+ requestQueryParameters[i]);
                //report modification to splunk only once
                /*if(context.getVariable("api.custom.log") === null || context.getVariable("api.custom.log") === ""){
                    context.setVariable("api.custom.log", '"proxyRequestQueryParametersModified":"true"');
                    context.setVariable("api.custom.log", context.getVariable("api.custom.log") + ',"proxyRequestQueryParametersModifiedBy":"apigee ValidateAndSanitizeRequest Policy"');
                }else if(!context.getVariable("api.custom.log").includes("proxyRequestQueryParametersModified")){
                        context.setVariable("api.custom.log", context.getVariable("api.custom.log") + ',"proxyRequestQueryParametersModified":"true"');
                        context.setVariable("api.custom.log", context.getVariable("api.custom.log") + ',"proxyRequestQueryParametersModifiedBy":"apigee ValidateAndSanitizeRequest Policy"');
                }*/
            }
    }
}

// do we really need this? I mean we already have what we expect to see in request
// why not just go through what we expect and if there is a match do nothing and if there is none remove
// the Cookie parameter then set the header Cookie accordingly?
function sanitizeRequestCookieParameters( messageExpectedCookieParameters, requestCookieParameters ) {
    //Most important : request.headers.names give a Java Set object so convert it to string array.
    //add more headers
    var matchFound = false;
    var newRequestCookieParameters = [];

    for (var i = 0; i < requestCookieParameters.length; i++) {
            matchFound = false;
            for (var x = 0; x < messageExpectedCookieParameters.length; x++) {
               if(requestCookieParameters[i].name.toLowerCase() == messageExpectedCookieParameters[x].name.toLowerCase()){
                    matchFound = true;
                    break;
               }
            }
            name = requestCookieParameters[i].name;
            value = requestCookieParameters[i].value;
            if(matchFound){
                newCookieParameters.push({name : name, value : value});
            }
    }
    return newRequestCookieParameters;
}

function validateRequestQueryParameter(requestQueryParameter, regularExpressionToMatch, requiredFlag) {
        //print("requestQueryParameters" + JSON.stringify(requestQueryParameter));
    //print("messageExpectedQueryParameters" + JSON.stringify(regularExpressionToMatch));
    // if the madatory header does not exist, error
    // and if it does check against regular expression
    if(requiredFlag === true){
        //print (requestHeader + ":" + context.getVariable(requestHeader));
        if(context.getVariable(requestQueryParameter) === null){
            createError("400", "invalidRequestQueryParameter", "Bad Request: required" + requestQueryParameter + " QueryParameter does not exist" , "apigeePolicy", "validateAndSanitizeRequest commonFunctions.js");
        }else{
            if(!(new RegExp(regularExpressionToMatch)).test(context.getVariable(requestQueryParameter.trim()))){
                createError("400", "invalidRequestQueryParameter", "Bad Request " + requestQueryParameter + " QueryParameter is invalid when matched with regular expression: " + regularExpressionToMatch , "apigeePolicy", "validateAndSanitizeRequest commonFunctions.js");
            }
        }
    }else{
         //print (requestHeader + ":" + context.getVariable(requestHeader));
        // do the regular expression match only if the optional header exists
        if(context.getVariable(requestQueryParameter) === null){
          // do nothing as it is optional field
        }else{
            //print ("in header exist and evaluation of RE: " + context.getVariable(requestHeader).match(regularExpressionToMatch));

            if(!(new RegExp(regularExpressionToMatch)).test(context.getVariable(requestQueryParameter.trim()))){
                createError("400", "invalidRequestQueryParameter", "Bad Request " + requestQueryParameter + " is invalid", "apigeePolicy", "validateAndSanitizeRequest commonFunctions.js");
                //print ("evaluation failed");
            }
        }
    }
}

function createError(status, errorCode, errorMessage, errorSource, errorSourceName){
    context.setVariable("error_status_code", status);
    context.setVariable("error_code", errorCode);
    context.setVariable("error_message", errorMessage);
    context.setVariable("error_source", errorSource);
    context.setVariable("error_source_name", errorSourceName);

   throw new Error(errorCode);
}

function safeVariableString(varName){
    try{
		varName = varName.replace(/[\b]/g, '')
                         .replace(/[\f]/g, '')
                         .replace(/[\n]/g, '')
                         .replace(/[\r]/g, '')
                         .replace(/[\t]/g, '');
        return varName;
	}catch(error){
			createError("500", "jsonParsingError", " could not sanitize variable, " + varName + " " + error.message, "apigeePolicy", "processJsonMessageContent commonFunctions.js");
	}
}
