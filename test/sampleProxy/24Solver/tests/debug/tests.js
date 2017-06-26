var testIds = function(context) {
    var result = {
        name: "testIds",
        status: "passed"
        //reasons: [] //only create if you get a failure if (!result.reason) result.reason = [];
    };

    var o = context.getVariable("response.content");
    if (o === "") {
        //fail if we don't have a response object
        resut.passed = false;
        result.reason = "no response.content";
        return result;
    }
    try {
        o = JSON.parse(o);
    } catch (e) {
        //fail if we can't parse repsonse to an object
        result.passed = false;
        result.reason = "failed to parse response.content to object";
        return result;
    }

    function isEncoded(str) {
        return decodeURIComponent(str) !== str;
    }

    function check(checkObj) {
        for (var property in checkObj) {
            var val = checkObj[property];
            var oType = Object.prototype.toString.call(val);
            if (oType === '[object Array]')
                for (var i = 0; i < val.length; i++) check(val[i]);
            else if (oType === '[object Object]') {
                check(val);
            } else if (oType === '[object String]') {
                if (property === "id" || property.lastIndexOf("Id") == property.length - 2) { //add a check that it ends with Id
                    if (!isEncoded(checkObj.id)) {
                        result.status = "failed";
                        if (!result.reason) result.reason = [];
                        result.reason.push("unencoded " + property +
                            ":" + checkObj.id);
                    }
                }
            }
        }
    }

    //check is a recursive routine that will examine every field
    //if the field is "id" or ends with "Id" then we check if it is encoded
    check(o);

    return result;
};

var testCamelCase = function(context) {

    var result = {
        name: "testCamelCase",
        status: "passed"
        //reasons: [] //only create if you get a failure if (!result.reason) result.reason = [];
    };

    var o = context.getVariable("response.content");
    if (o === "") {
        //fail if we don't have a response object
        resut.passed = false;
        result.reason = "no response.content";
        return result;
    }
    try {
        o = JSON.parse(o);
    } catch (e) {
        //fail if we can't parse repsonse to an object
        result.passed = false;
        result.reason = "failed to parse response.content to object";
        return result;
    }

    function camelCase(str) {
        return (str.charAt(0).toLowerCase() + str.slice(1) || str).toString();
    }

    function check(checkObj) {
        for (var property in checkObj) {
            //test property if camel case
            if (property + "" !== camelCase(property + "")) {
                result.status = "failed";
                if (!result.reason) result.reason = [];
                result.reason.push("field \"" + property + "\" not camelCase");
            }

            var val = checkObj[property];
            var oType = Object.prototype.toString.call(val);
            if (oType === '[object Array]')
                for (var i = 0; i < val.length; i++)
                    check(val[i]);
            else if (oType === '[object Object]')
                check(val);
        }
    }

    check(o);
    return result;
};

var all = function(context) {
    //returns an array of results
    var results = [];
    results.push(testIds(context));
    results.push(testCamelCase(context));
    return results;
};

module.exports = {
    all: all,
    testIds: testIds,
    testCamelCase: testCamelCase
};
