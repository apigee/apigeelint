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

const uris = {
    getEnviros: function(aConfig) {
      return "/v1/organizations/" + aConfig.org + "/environments/";
    },
    getOrgAPIs: function(aConfig) {
      return "/v1/organizations/" + aConfig.org + "/apis";
    },
    getRevisions: function(aConfig, args) {
      return "/v1/organizations/" + aConfig.org + "/apis/" + args;
    },
    getBundle: function(aConfig, args) {
      return (
        "/v1/o/" +
        aConfig.org +
        "/apis/" +
        args.api +
        "/revisions/" +
        args.revision +
        "?format=bundle"
      );
    }
  },
  https = require("https"),
  os = require("os");

ManagementServer.prototype.get = function(uri, aConfig, args, callback) {
  aConfig = this.verifyConfig(aConfig);
  this.mgmtServerQueue.push({ uri, aConfig, args, callback });
  if (!this.sending) {
    makeNextCall(this);
  }
};

function makeNextCall(ms) {
  var call = ms.mgmtServerQueue.shift();
  if (call) {
    ms.sending = true;
    _get(ms, call.uri, call.aConfig, call.args, function(body, res) {
      if (call.callback) {
        call.callback(body, res);
        makeNextCall(ms);
      }
    });
  } else {
    ms.sending = false;
  }
}

function _get(ms, uri, aConfig, args, callback) {
  var data = "";

  if (aConfig.attempts > 1) {
    console.log("processing " + aConfig.attempts + " attempt");
  }

  var options = {
    host: aConfig.mgmtApiHost,
    port: 443,
    path: uris["get" + uri](aConfig, args),
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: aConfig.authorization
    }
  };

  var req = https.request(options, function(res) {
    if (res.statusCode === 403) {
      callback(data, res);
    } else if (res.statusCode >= 300) {
      ms.get(uri, aConfig, args, callback);
    }
    if (args.onRes) {
      args.onRes(res, aConfig);
    } else {
      res.on("data", function(d) {
        data += d;
      });
      res.on("error", function(e) {
        ms.get(uri, aConfig, args, callback);
      });
    }
    res.on("end", function() {
      callback(data, res);
    });
  });

  req.on("error", function(e) {
    ms.get(uri, aConfig, args, callback);
  });
  req.end();
}

ManagementServer.prototype.verifyConfig = function(aConfig) {
  aConfig.maxAttempts = aConfig.maxAttempts || this.setup.maxAttempts;
  aConfig.attempts = aConfig.attempts || 1;
  aConfig.authorization = aConfig.authorization || this.setup.authorization;
  aConfig.retryDelay = aConfig.retryDelay || this.setup.retryDelay;
  aConfig.mgmtApiHost = aConfig.mgmtApiHost || this.setup.mgmtApiHost;
  return aConfig;
};
ManagementServer.prototype.getAuthorization = function() {
  return this.setup.authorization;
};
ManagementServer.prototype.getHost = function() {
  return this.setup.mgmtApiHost;
};

function ManagementServer(setup) {
  if (typeof setup === "string") {
    setup = { org: setup };
  } else {
    setup = setup || {};
  }

  if (!setup.user && !setup.password) {
    try {
      var lintConfig = require(os.homedir() + "/.apigeeLintConfig.json");
      if (lintConfig[setup.org]) {
        setup.user = lintConfig[setup.org].user;
        setup.password = lintConfig[setup.org].password;
      } else if (lintConfig._default) {
        setup.user = lintConfig._default.user;
        setup.password = lintConfig._default.password;
      }
    } catch (e) {
      //no config init values otherwise
    }
  }

  this.setup = {};
  this.setup.maxAttempts = setup.maxAttempts || 5;
  this.setup.timeout = setup.timeout || 180000;
  this.setup.retryDelay = setup.retryDelay || 300;
  this.setup.mgmtApiHost = setup.mgmtApiHost || "api.enterprise.apigee.com";
  this.setup.authorization =
    setup.authorization ||
    (setup.user &&
      setup.password &&
      "Basic " +
        new Buffer(setup.user + ":" + setup.password).toString("base64")) ||
    (process.env.au &&
      process.env.as &&
      "Basic " +
        new Buffer(process.env.au + ":" + process.env.as).toString("base64"));
  if (!this.setup.authorization) {
    throw new Error(
      "must provide authorization or .user and .secret or have environment variables au and as"
    );
  }
  this.mgmtServerQueue = [];
  this.sending = false;
}

module.exports = ManagementServer;
