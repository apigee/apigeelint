 /*
 * Check If Under Maintenance is a policy that checks if:
 * 1. The entire proxy should be put under maintenance
 * 2. One of the APIs should be put under maintenance
 * When a proxy or an API is under maintenance, apigee returns HTTP custom response code and 
 * custom response JSON payload as per the UnderMaintenanceStateConfig KVM Parameter
 * 
 *
 * {
 *      "proxyUnderMaintenance": false,
 *      "proxyUnderMaintenanceResponseCode": 503,
 *      "proxyUnderMaintenanceResponsePayload": "{\"message\": \"Service is Under Maintenance.. \"}",
 *      "endpointsUndermaintenance": [
 *          {
 *              "pathSuffixRE": "^/products/*remove$",
 *              "httpVerb": "GET",
 *              "httpResponseCode": 503,
 *              "responseContent": "{\"message\": \"This service in under maintenance, will be back soon.. \"}"
 *              }
 *      ]
 * }
 *
 */
 
try{
    
   /* -----------------------------------------------------------------------
    * 0. Retrieve properties from JavaScript policy and get current flow name
    *    Validate inputs that the script would be using for validating incoming
    *    request
    * -----------------------------------------------------------------------
    */

    // 0.1 retrieve properties from JS-ValidateAndSanitizeRequest policy

    var UnderMaintenanceStateVariable = properties.UnderMaintenanceStateVariable; // Returns UnderMaintenanceStateVariable
    var UnderMaintenanceStateConfig = null;
    // 0.2 Verify that properties are set correctly
    if(!UnderMaintenanceStateVariable){
        createError("530", "MissingProperty", " policy property UnderMaintenanceStateVariable is missing", "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
    }else{
     //   validate UnderMaintenanceStateConfig
        UnderMaintenanceStateConfig = JSON.parse(context.getVariable(UnderMaintenanceStateVariable));
        if(UnderMaintenanceStateConfig.constructor !== ({}).constructor){
            createError("400", "BadConfigFormat", " UnderMaintenanceStateConfig value is not in the correct format. The value needs to be JSON in teh format outlined in the comments section above", "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
        }
    }

    /*
     * 1. Process UnderMaintenanceStateConfig KVM Parameter
     *
     */

    var proxyUnderMaintenance = UnderMaintenanceStateConfig.proxyUnderMaintenance;
    var proxyUnderMaintenanceResponseCode = UnderMaintenanceStateConfig.proxyUnderMaintenanceResponseCode;
    var proxyUnderMaintenanceResponsePayload = UnderMaintenanceStateConfig.proxyUnderMaintenanceResponsePayload;
    var endpointsUndermaintenance = UnderMaintenanceStateConfig.endpointsUndermaintenance;

    if(!proxyUnderMaintenanceResponseCode || !proxyUnderMaintenanceResponsePayload || !endpointsUndermaintenance){
        createError("500", "MissingConfig", " One of the UnderMaintenanceStateConfig JSON element is missing", "apigeePolicy", "JS-CheckIfUnderMaintenance JS-CheckIfUnderMaintenance.js");
    }

    /*
     * 2. Check if the entire proxy is Under Maintenance
     *
     */
 
    if(proxyUnderMaintenance === true){
        createError(proxyUnderMaintenanceResponseCode, "ProxyUnderMaintenance", proxyUnderMaintenanceResponsePayload);
    }
 
 
    /*
     * 3. Check if one of the APIs is Under Maintenance
     *
     */

    for(var i=0; i<endpointsUndermaintenance.length;i++){
        if(
            (new RegExp(endpointsUndermaintenance[i].pathSuffixRE)).test(context.getVariable("proxy.pathsuffix")) &&
            (new RegExp(endpointsUndermaintenance[i].httpVerb)).test(context.getVariable("request.verb"))
          ){
              print("inside endpoint undermaintenance check");
            createError(endpointsUndermaintenance[i].httpResponseCode, "ApiUnderMaintenance", endpointsUndermaintenance[i].responseContent);
        }
    }

}catch(error){
    if(error.message.match(/^(MissingProperty|BadConfigFormat|MissingConfig|ApiUnderMaintenance|ProxyUnderMaintenance)$/)){
            throw error;
    }else{
            createError("500", "CheckIfUnderMaintenanceUnknownError", JSON.stringify(error), "apigeePolicy", "ValidateAndSanitizeRequest validateAndSanitizeRequest.js");
    }
    
}