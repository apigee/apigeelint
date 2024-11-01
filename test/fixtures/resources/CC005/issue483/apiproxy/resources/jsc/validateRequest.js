function msgIdHdr (messageId) {
    aPrint('X-NW-Message-ID:' + messageId);
    if (messageId === null || messageId === undefined) {
        common.throwError('Bad Request', {
            "error": "Message ID request header missing",
            "action": "add X-NW-Message-ID as a request header",
            "detail": "X-NW-Message-ID must be alphanumeric (no special character)"
        },
            400, 'Bad Request');
    } else {
        if (! /^[a-zA-Z0-9-]+$/.test(messageId)) {
            // since the response type is application/json, the error context shouldn't use double quotes in the value.  Single quotes are OK.
            common.throwError('Bad Request', "X-NW-Message-ID header is invalid; must be alphanumeric optionally with dashes ('-')", 400, 'Bad Request');
        }
    }
    context.setVariable('globalMessageId', messageId);
}

function contentTypeHdr (contentType) {
    if (contentType === null || contentType === undefined) {
        common.throwError('Bad Request', 'Content-Type Header is missing', '415', 'Bad Request');
    } else {
        aPrint('contentTypeHdr: ' + contentType);
        // the 'standard' media type is application/json, if your API handles other media types, update the code below appropriately
        if (contentType != 'application/json') {
            common.throwError('Bad Request', "Content-Type Header is invalid; 'application/json' expected", 400, 'Bad Request');
        }else {
            // Set the content-type variable for EnterpriseLogging
            context.setVariable('logInfo.logContentType', "json");
        }
    }
}

// An example of how you may validate something that came in a request and throw an error while setting the
// userMessage, developerMessage, statusCode, and reasonPhrase conveniently.  The catchJSErrors policy will
// trap the run time exception and the fault flow will organize the variables into the standard error message.
function requestBody (body) {
    aPrint(JSON.stringify(body,null,2));
    if (! body || Object.keys(body).length === 0) {
        common.throwError('Request payload (body) is undefined',
                    'the request body was null or undefined on a POST, PUT, or PATCH operation, investigate',
                    400,'Bad Request');
    } else {
        // the try/catch block is necessary, because the body may not have the address property,
        // which will throw a run time error when the .zip property is accessed on undefined
        
        // the code below is commented out as it's a contrived example to show what request payload validation
        // code might look like.  Several functions could be used to validate various payloads depending on the
        // resource URL.  Look at the mocking policies to see an example of JavaScript code which examines the
        // proxy.pathSuffix to determine what resource is considered in the request.
        
        // try {
        //     var zipCode = body.address.zip;

        //     // create regular expression for valid zip formats
        //     var re = /^\d{5}(?:[-\s]\d{4})?$/;

        //     if (!re.test(zipCode)) {
        //         common.throwError(zipCode + ': Not a valid zip code',
        //                     'zip code should match the regular expression pattern /^\d{5}(?:[-\s]\d{4})?$/',
        //                     400,'Bad Request');
        //     }
        // } catch (e) {
        //     // Apigee console printing
        //     aPrint('exception block: ' + e);
    
        //     // using replace() to get rid of double quotes since an error message may say something like
        //     // 'cannot find "zip" on undefined' this error message would cause JSON message to be invalid
        //     // since it had quotes in the string.
        //     throwError('Bad Request - Exception',
        //     'Exception found validating zipcode: ' + e.message.replace(/"/g, "'"),
        //     400,'Bad Request');
        // }
    }
}

if (typeof module !== 'undefined') {
    // this is needed for Jasmine to include the common functions file.  In Apigee it's included
    // using the <IncludeURL> tag; so it's not required, except when invoked by Jasmine unit testing
    common = require('./common.js');

    // export the functions in an object, so Jasmine can see the as method calls and can Spy on them.
    // In Apigee, the module will be undefined, and execution will begin below with the else clause
    module.exports = {
        msgIdHdr: msgIdHdr,
        contentTypeHdr: contentTypeHdr,
        requestBody: requestBody
    };
} else {
    // this is needed for the common function(s) that are tested or spied on by Jasmine
    const common = {
        throwError: throwError
    };
    
    // the Apigee JavaScript object model has a context object that that contains both methods and data
    // two of the most common methods are getVariable() and setVariable() that read and create/update
    // flow variables.  The context.session object starts each flow as and empty object and provides
    // the passing of information between JavaScript policy executions.  Finally, the context.*Request
    // and context.*Response objects provide access to the components of the proxy or target (*) requests
    // and responses, e.g. (headers, query, payload body, method (verb), etc.)
    // detailed information can be found at https://docs.apigee.com/api-platform/reference/javascript-object-model

    // validate headers - keep these header validations, as they support the NW Standards/Best Practices
    // validate that the request has the standard X-NW-Message-ID header
    // example using context.getVariable() method
    msgIdHdr(context.getVariable("request.header.X-NW-Message-ID"));

    // validate the Content-Type header and request payload, if one is provided/expected
    if (['POST','PUT','PATCH'].indexOf(context.proxyRequest.method) >= 0) {
        // validate the Content-Type header is present and as expected (modify the function as appropriate)
        // example using context.proxyRequest object
        contentTypeHdr(context.proxyRequest.headers['Content-Type']);

        // the example is contrived and is therefore commented out; use the pattern
        // to establish request input validation as appropriate for your situation.
        // Note: if your target endpoint does input validation AND it provides good
        //       error responses, you should NOT duplicate that here.  It's best to
        //       have your business logic, including validation, in your target
        //       endpoint if possible; otherwise, add it here.
        requestBody(context.proxyRequest.body.asJSON);
    }
}