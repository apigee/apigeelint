/*
  Copyright 2019 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

context = require("../../../../package/apigee-jsc-debug");

var config = {
    policy: "jsCalculate",
    traceFile: "./trace-files/trace-1429993197148.xml",
    //all,monitors,inputs,outputs,accesses,monitors
    results: "diff,monitors,outputs,errors,jshint",
    "diff": "all",
    debug: false,
    traceIndex: "all",
    onFinish: function() {
        context.echoJson("response.content");
    }
};

context.debug(config);
