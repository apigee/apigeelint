// this file contains reusable fuctions for your JavaScript.  Use the <IncludeUR> tag in your
// JavaScript policy to pull in this code, as "require" doesn't work in Apigee

// the aPrint function wraps the Apigee print() function, and disables it in production
// additionally, it disables the debug printing when running Jasmine unit tests; so,
// your unit test console output is cleaner and easier to follow.
function aPrint (str) {
    
    if (typeof module === 'undefined' && typeof apigeeEnv === 'undefined') {
        apigeeEnv = context.getVariable("environment.name");
    }

    if (/^(dev|test|stage)$/.exec(apigeeEnv)) {
        print(str);
    }
}

// the throwError method raises a fatal error, and pushes the proxy flow into the error flow (similar to the RaiseFault policy)
function throwError (userMsg, developerMsg, httpStatus, reasonPhrase) {
    if (typeof module == 'undefined') {
        throw new Error(JSON.stringify({
            "userMessage": userMsg,
            "developerMessage": developerMsg,
            "status": httpStatus,
            "reasonPhrase": reasonPhrase
        }));
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        aPrint: aPrint,
        throwError: throwError
    };
} else {
    var apigeeEnv;
}