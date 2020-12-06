 /*
 * If the API call flow ended up here then there is an error happened that need to be handled.
 *
 * Refer to:
 *      https://docs.apigee.com/api-platform/fundamentals/fault-handling#buildingconditions-variablesspecifictopolicyerrors
 * Example fault message: 
 * {
 *   "fault": {
 *     "faultstring": "Failed to resolve API Key variable request.queryparam.apikey",
 *     "detail": {
 *       "errorcode": "steps.oauth.v2.FailedToResolveAPIKey"
 *     }
 *   }
 * }
 */
 
try {
     var faultCode = context.getVariable("fault.name");
     var customErrorCode = context.getVariable("error_code");
     
    /*
     * HTTP HEAD requests don't have body in the response. response body is removed by apigee.
     * here we are checking and confirming that the error raised was 501 (Method Not Implemented)
     * and http verb is HEAD and accordingly setting the error.content as 
     * both would be removed by apigee as the request verb is HEAD
     */
     
    if(context.getVariable("request.verb") === "HEAD" && context.getVariable("error.status.code") == "501"){
         var errorContent = {
                              "code":"MethodNotImplemented", 
                              "message": "request method " + context.getVariable("request.verb") + " is not Implemented in any of the flows for this proxy", 
                              "source":"apigeePolicy", 
                              "sourceName": "MethodNotImplemented apigee flow condition. this error message was raised by JS-SetErrorStatusCode.js"};
         context.setVariable("error.content", JSON.stringify(errorContent));
     }
     
     var faultMessage = "";

    var errorHttpStatusCode = null;
    var errorCode = null;
    var errorMessage = null;
    var errorSource = null;
    var errorSourceName = null;
    var errorFound = false;

   /*
    * We have 4 types of errors based on the current setup:
    * 1. Custom fault raised from JavaScript policies
    * 2. Custom fault raised from apigee standard RaiseFault policy 
    * 3. Error raised by backend (nothing to do with apigee)
    * 4. Any other fault that is standard and raised by apigee.
    */
 
    if (customErrorCode) { //1.
        errorHttpStatusCode = context.getVariable("error_status_code");
        errorCode = context.getVariable("error_code");
        errorMessage = context.getVariable("error_message");
        errorSource = context.getVariable("error_source");
        errorSourceName = context.getVariable("error_source_name");
        errorFound = true;
    }else if(faultCode === "RaiseFault") { //2.
        faultMessage = JSON.parse(context.getVariable("error.content"));
        errorHttpStatusCode = context.getVariable("error.status.code");
        //Directly assign the faultMessage
        errorCode = faultMessage.code;
        errorMessage = faultMessage.message;
        errorSource = faultMessage.source;
        errorSourceName = faultMessage.sourceName;
        errorFound = true;
    }else if(faultCode === 'ErrorResponseCode'){ //3.
        errorHttpStatusCode = context.getVariable("message.status.code");
        errorCode = "ErrorResponseCode";
        errorMessage = context.getVariable("response.content");
        print("response.content ");
        errorSource = "backend";
        errorSourceName = "TargetVerb: " + context.getVariable("api.target.request.verb") + " TargetHostPort: " + context.getVariable("target.host") + ":" + context.getVariable("target.port") + " TargetResourcePath: " +  context.getVariable("api.target.request.url") ;
        errorFound = true;
    }else { //4.
        faultMessage = JSON.parse(context.getVariable("error.content"));
        errorHttpStatusCode = context.getVariable("error.status.code");
        errorCode = faultCode;
        errorMessage = faultMessage.fault.faultstring + " " + JSON.stringify(faultMessage.fault.detail);
        errorSource = "apigeePolicy";
        errorSourceName = "apigeePolicy";
        errorFound = true;
    }
    
    if (errorFound) {
        var error = {};
        if(errorCode === "ApiUnderMaintenance" || errorCode === "ProxyUnderMaintenance"){
            error = JSON.parse(errorMessage);
        }else{
            error.code = errorCode;
	        error.message = errorMessage;
	        error.source = errorSource;
	        error.sourceName = errorSourceName;
        }
        context.setVariable("response.header.content-type", "application/json");
        context.setVariable("error.content", JSON.stringify(error));
        //context.setVariable("error.content", "this is my error");
        context.setVariable("error.status.code", errorHttpStatusCode);
        context.setVariable("error.code", errorCode);
        // copy variables to other variables that splunk can pickup as the error content 
        // would be modified to send only error code to the client
        context.setVariable("api.error.status.code", context.getVariable("error.status.code"));
        context.setVariable("api.error.content", context.getVariable("error.content"));
    }

}catch(error){
    createError("SetErrorUnknownError", error.message, "Unknown", "apigeePolicy", "JS-SetErrorStatusCode and JS-SetErrorStatusCode.js");
}