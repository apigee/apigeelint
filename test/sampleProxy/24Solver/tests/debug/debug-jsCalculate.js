context = require("apigee-jsc-debug");

var config = {
    policy: "jsCalculate",
    traceFile: "./trace-files/trace-1429993197148.xml",
    traceIndex: "all",
    debug: true,
    //all,monitors,inputs,outputs,accesses,monitors
    results: "monitors,outputs,errors,jshint",
    onFinish: function() {
        context.echoJson("response.content");
    }
};

context.debug(config);
