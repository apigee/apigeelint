 //validate CORS from KVM
// 0.1 retrieve properties from JS-ValidateCors policy

var allowedCorsDomainsVariable = properties.allowedCorsDomainsVariable; // Returns allowedCorsDomainsVariable


// 0.2 Verify that properties are set correctly
if(!allowedCorsDomainsVariable){
    createError("500", "MissingVariable", " One of the JS-ValidateCors policy properties is missing", "apigeePolicy", "JS-ValidateCors JS-ValidateCors.js");
}else{
 //   do nothing
}
var origin = context.getVariable('request.header.origin');
var requestVerb = context.getVariable('request.verb');
var allowedOrigins = context.getVariable(allowedCorsDomainsVariable);


//var corsRegx = "^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$";
var corsRegx = "^(https:\/\/www\.|https:\/\/)[a-z0-9\.\-]{3,80}$";

//1. origin header must exist for OPTIONS calls and must not be empty
if((origin === null || origin === "") && requestVerb === "OPTIONS"){
    context.setVariable("error_header","origin");
    createError("400", "invalidRequestHeader","origin is header value is empty or origin header does not exist", "apigeePolicy", "validateCors validateCors.js");
}

//2. origin header value must exist for OPTIONS must be in a valid format
if(origin !== null){
    var allowedOriginsArray = allowedOrigins.split(",");
    if(!(new RegExp(corsRegx)).test(origin)){
        context.setVariable("error_header","origin");
        createError("400", "invalidRequestHeader","origin header value is invalid. It does not match regular expression: " + corsRegx, "apigeePolicy", "validateCors validateCors.js");
    }
    //3. origin header value if exist, it must match any of the allowed values retrieved from KVM
    matchFound = false;
    for(i=0;i<allowedOriginsArray.length;i++){
        if(allowedOriginsArray[i] == origin){
           matchFound = true;
           context.setVariable('api.allowedOrigin', allowedOriginsArray[i]);
           break;
        } 
    }
    if(!(matchFound)){
        context.setVariable("error_header","origin");
        createError(403,"Forbidden","Request originating from "+origin+" is not allowed", "apigeePolicy", "validateCors validateCors.js");
    } 
}

