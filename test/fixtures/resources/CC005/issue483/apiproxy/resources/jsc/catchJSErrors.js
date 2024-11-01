function catchJSErrors(){
    
    // in the Apigee error flow, error.content is always JSON object with the structure
    // { "fault": { "faultstring": "Apigee [error.message]",
    //              "detail": { "errorcode": "[error code prefix].[fault.name]" } } }
    // if javascript throws an error with 'throw' the string is inserted as the faultstring
    // value.  We can use this to extract a escape quoted JSON object out of the string,
    // thereby passing variables to construct the error and user message state
    var errorContent = context.getVariable('error.content');
    aPrint("error content:"+errorContent+":");
    var isErrorPassthrough = false;
    var parsedErrContent;

    try {
    // if apigee error content is in standard message set the flag "skipGenerateErrorPolicy"
        parsedErrContent = JSON.parse(errorContent);
        
        if (parsedErrContent.userMessage && parsedErrContent.developerMessage && parsedErrContent.messageID){
        context.setVariable("skipGenerateErrorPolicy",true);
        // context.setVariable(error.content, parsedErrContent);
        isErrorPassthrough = true;
    }
    }catch (err){
        aPrint ('Proceed with setting up the developer message with apigee error context');
    }

    
    // if error.content is empty (""), that means the provider had an error response,
    // but Apigee didn't set the error.content.  If the OAS requires error.content to be
    // an object, uncomment the code below to set it as such.
    // if (errorContent === undefined || errorContent === null || errorContent === "") {
    //     errorContent = '{}';
    //     context.setVariable('error.content',errorContent);
    // }
    
    if (!isErrorPassthrough){
        try {
            var faultObj = JSON.parse(errorContent);
            var faultstring = faultObj.fault.faultstring;
            
            // if .js code identified and threw a known error, the faultstring will contain an
            // embedded JSON object of the form { "userMessage": "value", "developerMessage": "value",
            // "status": 999, "reasonPhrase": "value" }
            // It's also possibile for a RaiseFault to construct a similar JSON payload
            
            // if an uncaught .js error occurs, then the faultstring will contain the .js file
            // location of the error, which doesn't have the JSON object.  Likewise, a system or
            // Apigee policy error won't have a JSON object in the faultstring.  That's OK
            // because in these scenarios, an error is thrown accessing errObj.userMessage and the
            // catch block is executed.  Catch leaves the existing variables unchanges (except for
            // stringifying error.content) and sets user.message (if undefined) to error.message;
            // so the user message isn't left blank.
            var errObj = JSON.parse(/\{.+\}/.exec(faultstring));
            context.setVariable('user.message',errObj.userMessage);
            
            // the current OAS specifies the developer message as a string, so any object placed
            // in errror.content needs to be stringified to match the OAS and be well formed JSON.
            var devMsg = errObj.developerMessage;
            switch (typeof devMsg) {
                case "object":
                case "array":
                    var newErrContent = JSON.stringify(devMsg); // now a string, but not escape quoted
                    context.setVariable('error.content','"' + newErrContent.replace(/\"/g,"\\\"") + '"');
                    break;
                // strings, numbers, and booleans are quoted also to match the OAS
                default:
                    context.setVariable('error.content','"' + devMsg.replace(/\"/g,"\\\"") + '"');
            }
            context.setVariable('error.status.code',errObj.status);
            context.setVariable('error.reason.phrase',errObj.reasonPhrase);
            
        }
        catch (err) {
            aPrint("caught error:" + err.message + "; this is normal");

            var userMessage = context.getVariable('user.message');
            aPrint("userMessage:" + userMessage);
        
            if (userMessage === undefined || userMessage === null) {
                aPrint("using Apigee error.message as a backup user.message");
                userMessage = context.getVariable('error.message');
                context.setVariable('user.message',userMessage.replace(/\"/g,"\\\""));
            }
            
            // if Apigee error content is passed as the developer message, it needs to
            // be strinfified first, so it matches the OAS.  If the OAS specifies an object
            // for the devMsg, remove this portion of code and uncomment setting
            // error.content to an empty object '{}' above.
            var devMsg = JSON.stringify(context.getVariable('error.content'));
            if (devMsg !== "") {
                context.setVariable('error.content', devMsg);
            }
        }
    }
}

// this block provides support for Jasmine unit testing.
if (typeof module !== 'undefined') {
    module.exports = catchJSErrors;
} else {
    catchJSErrors();
}