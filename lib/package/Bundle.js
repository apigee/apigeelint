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

var FindFolder = require("node-find-folder"),
  decompress = require("decompress"),
  fs = require("fs"),
  async = require("async"),
  path = require("path"),
  Resource = require("./Resource.js"),
  Policy = require("./Policy.js"),
  Endpoint = require("./Endpoint.js"),
  xpath = require("xpath"),
  Dom = require("xmldom").DOMParser,
  bundleType = require('./BundleTypes.js'),
  debug = require("debug")("bundlelinter:Bundle");

const util = require("util");

function _buildEndpoints(folder, tag, bundle, processFunction) {
  try {
    if (fs.existsSync(folder)) {
      var files = fs.readdirSync(folder);
      files.forEach(function(proxyFile) {
        //can't be a directory
        //must end in .xml

        var fname = folder + proxyFile;
        if (proxyFile.endsWith(".xml") && fs.lstatSync(fname).isFile()) {
          var doc = xpath.select(
            tag,
            new Dom().parseFromString(fs.readFileSync(fname).toString())
          );
          doc.forEach(function(element) {
            processFunction(element, fname, bundle);
          });
        }
      });
    }
  } catch (e) {
    debugger;
    debug(e);
  }
}

function buildProxyEndpoints(bundle) {
  var folder = bundle.proxyRoot + "/proxies/",
    tag = "ProxyEndpoint",
    processFunction = function(element, fname, bundle) {
      bundle.proxyEndpoints = bundle.proxyEndpoints || [];
      bundle.proxyEndpoints.push(new Endpoint(element, bundle, fname));
    };
  _buildEndpoints(folder, tag, bundle, processFunction);
}

function buildsharedflows(bundle) {
  var folder = bundle.proxyRoot + "/sharedflows/",
    tag = "SharedFlow",
    processFunction = function(element, fname, bundle) {
      bundle.proxyEndpoints = bundle.proxyEndpoints || [];
      bundle.proxyEndpoints.push(new Endpoint(element, bundle, fname));
    };
  _buildEndpoints(folder, tag, bundle, processFunction);
}

function buildTargetEndpoints(bundle) {
  var folder = bundle.proxyRoot + "/targets/",
    tag = "TargetEndpoint",
    processFunction = function(element, fname, bundle) {
      bundle.targetEndpoints = bundle.targetEndpoints || [];
      bundle.targetEndpoints.push(new Endpoint(element, bundle, fname));
    };
  _buildEndpoints(folder, tag, bundle, processFunction);
}

function buildPolicies(bundle) {
  //get the list of policies and create the policy objects
  bundle.policies = [];
  if (fs.existsSync(bundle.proxyRoot + "/policies")) {
    var files = fs.readdirSync(bundle.proxyRoot + "/policies");
    files.forEach(function(policyFile) {
      var ext = policyFile.split(".").pop();
      if (ext === "xml") {
        bundle.policies.push(
          new Policy(bundle.proxyRoot + "/policies", policyFile, bundle)
        );
      }
    });
  }
}

function _buildResources(parent, path, resources) {
  //given the passed path append resources
  //if the path is dir then recurse
  var files = fs.readdirSync(path);
  files.filter(file => file !== 'node_modules').forEach(function(policyFile) {
    if (fs.statSync(path + "/" + policyFile).isDirectory()) {
      _buildResources(parent, path + "/" + policyFile, resources);
    } else if (policyFile !== ".DS_Store") {
      resources.push(new Resource(parent, path + "/" + policyFile, policyFile));
    }
  });
}

function buildResources(bundle) {
  //get the list of policies and create the resources objects - must recurse
  bundle.resources = [];
  if (fs.existsSync(bundle.proxyRoot + "/resources")) {
    _buildResources(bundle, bundle.proxyRoot + "/resources", bundle.resources);
  }
}

Bundle.prototype.getElement = function() {
  //read the contents of the file and return it raw
  if (!this.element) {
    this.element = new Dom().parseFromString(
      fs.readFileSync(this.filePath).toString()
    );
  }
  return this.element;
};

Bundle.prototype.getName = function() {
  if (!this.name) {
    //look at the root of the proxy for the .xml file and get name from there
    try {
      var attr = xpath.select("/" + this.xPathName + "/@name", this.getElement());
      this.name = (attr[0] && attr[0].value) || "undefined";
    } catch (e) {
      this.name = "undefined";
    }
  }
  return this.name;
};

Bundle.prototype.getRevision = function() {
  if (!this.revision) {
    //look at the root of the proxy for the .xml file and get name from there
    try {
      var attr = xpath.select("/" + this.xPathName + "/@revision", this.getElement());
      this.revision = (attr[0] && attr[0].value) || "undefined";
    } catch (e) {
      this.revision = "undefined";
    }
  }
  return this.revision;
};

function buildAll(bundle, bundleName) {
  buildResources(bundle);
  buildPolicies(bundle);
  buildProxyEndpoints(bundle);

  //no targets for shared flow
  if(bundleName !== bundleType.BundleType.SHAREDFLOW){
    buildTargetEndpoints(bundle);
  }
}

function processFileSystem(config, bundle, cb) {
  //ok lets build our bundle representation from file system
  //note all methods ultimately will call this init
  //usually after they retrieve the bundle from a remote
  //set bundle.root to absolute path
  bundle.root = path.resolve(config.source.path);
  //populate the filepath by looking at the only .xml file
  //present at the bundle.root
  var files = [];
  fs.readdirSync(bundle.root).forEach(function(file) {
    if (
      fs.lstatSync(path.join(bundle.root, file)).isFile() &&
      file.endsWith(".xml")
    ) {
      files.push(file);
    }
  });

  if (files.length > 1) {
    debug("More than one .xml file found at proxy root. Aborting.");
  }
  bundle.filePath = bundle.root + "/" + files[0];

  bundle.proxyRoot = bundle.root;

  var bundleName = config.source.bundleType;

  //bundle.policies = [];
  //process.chdir(config.source.path);
  bundle.report = {
    filePath: bundle.root.substring(bundle.root.indexOf("/" + bundleName)),
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    messages: []
  };

  //only run for proxy or shared flow root
  if (!bundle.proxyRoot.endsWith(bundleName)) {
    var folders = new FindFolder(bundleName);
    //potentially have (apiproxy and target/apiproxy) or shared flow
    if (bundleName == bundleType.BundleType.APIPROXY && folders.includes("target/apiproxy")) {
      //we prefer the target bundle when we have both
      //refactor to contains then walk through options
      bundle.proxyRoot = "target/apiproxy";
      buildAll(bundle, bundleName);
    } else if (folders.includes(bundleName)) {
      bundle.proxyRoot = bundleName;
      buildAll(bundle, bundleName);
    } else {
      //warn and be done
      bundle.addMessage({
        message: "No " + bundleName + " folder found in: " + JSON.stringify(folders)
      });
    }
  }
  if (cb) {
    //call back when things are all done
    cb(bundle);
  }
}

function Bundle(config, cb) {
  //if source is managementServer then download the bundle
  //rewrite the source to be filesystem
  var bundle = this;

  this.xPathName = bundleType.getXPathName(config.source.bundleType);
  this.bundleTypeName = config.source.bundleType;
  this.excluded = config.excluded;
  
  if (config.source.type === "ManagementServer") {
    //shared flow not implemented for management server
    if(config.source.bundleType === bundleTypes.BundleType.SHAREDFLOW){
      throw "SharedFlows for management server not supported";
    }

    var ManagementServer = require("./ManagementServer.js"),
      org = config.source.org,
      api = config.source.api,
      revision = config.source.revision,
      tempFolder = "/tmp/" + api,
      ms = new ManagementServer({
        org,
        authorization: config.source.authorization
      });

    deleteFolderRecursive(tempFolder);
    fs.mkdirSync(tempFolder);
    var fileStream = fs.createWriteStream(tempFolder + "/apiproxy.zip");

    ms.get(
      "Bundle",
      { org },
      {
        api,
        revision,
        onRes: function(res) {
          if (res.statusCode === 200) {
            res.pipe(fileStream).on("close", function() {
              decompress(
                tempFolder + "/apiproxy.zip",
                tempFolder
              ).then(files => {
                //add the info to the config object here
                config.source.path = tempFolder + "/apiproxy";
                processFileSystem(config, bundle, cb);
              });
            });
          } else {
            if (cb) {
              cb(null, {
                status: res.statusCode,
                message: res.statusMessage
              });
            }
          }
        }
      },
      function(body) {
        //callback on bundle downloaded
        if (body.error) {
          console.log(body.error);
          //bundle.addMessage(JSON.stringify(body.error));
          deleteFolderRecursive(tempFolder);
        }
      }
    );
  } else {
    processFileSystem(config, bundle, cb);
  }
}

Bundle.prototype.getReport = function(cb) {
  //go out and getReport from endpoints, resources, policies

  var result = [this.report],
    append = function(a) {
      a.forEach(function(e) {
        result.push(e.getReport());
      });
    };

  //no endpoints in shared flow
  if(this.bundleTypeName !== bundleType.BundleType.SHAREDFLOW){
    append(this.getEndpoints());
  }
  append(this.getPolicies());
  append(this.getResources());
  if (cb) {
    cb(result);
  }
  return result;
};

Bundle.prototype.addMessage = function(msg) {
  //lets inspect what we got
  //if it includes a plugin field
  //then process new style
  if (msg.hasOwnProperty("plugin")) {
    msg.ruleId = msg.plugin.ruleId;
    msg.severity = msg.plugin.severity;
    msg.nodeType = msg.plugin.nodeType;
    delete msg.plugin;
  }

  if (!msg.hasOwnProperty("entity")) {
    msg.entity = this;
  }
  if (
    !msg.hasOwnProperty("source") &&
    msg.entity &&
    msg.entity.hasOwnProperty("getSource")
  ) {
    msg.source = msg.entity.getSource();
  }
  if (
    !msg.hasOwnProperty("line") &&
    msg.entity &&
    msg.entity.hasOwnProperty("getElement")
  ) {
    msg.line = msg.entity.getElement().lineNumber;
  }
  if (
    !msg.hasOwnProperty("column") &&
    msg.entity &&
    msg.entity.hasOwnProperty("getElement")
  ) {
    msg.column = msg.entity.getElement().columnNumber;
  }
  delete msg.entity;

  this.report.messages.push(msg);
  //Severity should be one of the following: 0 = off, 1 = warning, 2 = error
  switch (msg.severity) {
    case 1:
      this.report.warningCount++;
      break;
    case 2:
      this.report.errorCount++;
      break;
  }
};

Bundle.prototype.getPolicyByName = function(pname) {
  var result;
  this.policies.some(function(policy) {
    if (policy.getName() === pname) {
      result = policy;
      return true;
    }
  });
  return result;
};

Bundle.prototype.onBundle = function(pluginFunction, cb) {
  pluginFunction(this, cb);
};

Bundle.prototype.onResources = function(pluginFunction, cb) {
  async.each(
    this.resources,
    function(resource, cb) {
      pluginFunction(resource, cb);
    },
    function(err) {
      cb(err);
    }
  );
};

Bundle.prototype.onPolicies = function(pluginFunction, cb) {
  async.each(
    this.getPolicies(),
    function(policy, cb) {
      pluginFunction(policy, cb);
    },
    function(err) {
      cb(err);
    }
  );
};

Bundle.prototype.onSteps = function(pluginFunction, callback) {
  //will need to run these in parallel
  var bundle = this;

  async.parallel(
    [
      function(cb) {
        if (bundle.getProxyEndpoints()) {
          async.each(
            bundle.getProxyEndpoints(),
            function(ep, cb) {
              ep.onSteps(pluginFunction, cb);
            },
            function(err) {
              cb(err);
            }
          );
        } else {
          cb("Bundle no proxyEndpoints");
        }
      },
      function(cb) {
        if (bundle.getTargetEndpoints()) {
          async.each(
            bundle.getTargetEndpoints(),
            function(ep, cb) {
              ep.onSteps(pluginFunction, cb);
            },
            function(err) {
              cb(err);
            }
          );
        } else {
          cb("Bundle no targetEndpoints");
        }
      }
    ],
    function(err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, result);
      }
    }
  );
};

Bundle.prototype.onConditions = function(pluginFunction, callback) {
  //will need to run these in parallel
  var bundle = this;

  async.parallel(
    [
      function(pcb) {
        if (bundle.getProxyEndpoints()) {
          async.each(
            bundle.getProxyEndpoints(),
            function(ep, ecb) {
              ep.onConditions(pluginFunction, ecb);
            },
            function(err) {
              pcb(err);
            }
          );
        } else {
          pcb("no proxyEndpoints");
        }
      },
      function(pcb) {
        if (bundle.getTargetEndpoints()) {
          async.each(
            bundle.getTargetEndpoints(),
            function(ep, ecb) {
              ep.onConditions(pluginFunction, ecb);
            },
            function(err) {
              pcb(err);
            }
          );
        } else {
          pcb("no targetEndpoints");
        }
      }
    ],
    function(err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, result);
      }
    }
  );
};

Bundle.prototype.onResources = function(pluginFunction, cb) {
  var bundle = this;

  if (bundle.getResources()) {
    async.each(
      bundle.getResources(),
      function(re, cb) {
        pluginFunction(re, cb);
      },
      function(err) {
        cb(err);
      }
    );
  } else {
    cb("no resources");
  }
};

Bundle.prototype.onFaultRules = function(pluginFunction, cb) {
  var bundle = this;

  if (bundle.getFaultRules()) {
    async.each(
      bundle.getFaultRules(),
      function(fr, cb) {
        fr && pluginFunction(fr, cb);
      },
      function(err) {
        cb(err);
      }
    );
  } else {
    cb("no faultRules");
  }
};

Bundle.prototype.onDefaultFaultRules = function(pluginFunction, cb) {
  var bundle = this;

  if (bundle.getDefaultFaultRules()) {
    async.each(
      bundle.getDefaultFaultRules(),
      function(dfr, cb) {
        dfr && pluginFunction(dfr, cb);
      },
      function(err) {
        cb(err);
      }
    );
  } else {
    cb("no defaultFaultRules");
  }
};

Bundle.prototype.onProxyEndpoints = function(pluginFunction, cb) {
  var eps = this.getProxyEndpoints();
  if (eps) {
    async.each(
      eps,
      function(ep, cb) {
        pluginFunction(ep, cb);
      },
      function(err) {
        cb(err);
      }
    );
  } else {
    cb("no proxyEndpoints");
  }
};

Bundle.prototype.onTargetEndpoints = function(pluginFunction, cb) {
  var eps = this.getTargetEndpoints();
  if (eps) {
    async.each(
      eps,
      function(ep, cb) {
        pluginFunction(ep, cb);
      },
      function(err) {
        cb(err);
      }
    );
  } else {
    cb("no targetEndpoints");
  }
};

Bundle.prototype.getProxyEndpoints = function() {
  if (!this.proxyEndpoints) {
    if(this.bundleTypeName === bundleType.BundleType.SHAREDFLOW){
      buildsharedflows(this);
    }else {
      buildProxyEndpoints(this);
    }

    if (!this.proxyEndpoints) {
      this.proxyEndpoints = [];
    }
  }
  return this.proxyEndpoints;
};

Bundle.prototype.getTargetEndpoints = function() {
  if (!this.targetEndpoints) {
    buildTargetEndpoints(this);
    if (!this.targetEndpoints) {
      this.targetEndpoints = [];
    }
  }
  return this.targetEndpoints;
};

Bundle.prototype.getEndpoints = function() {
  if (!this.endpoints) {
    this.endpoints = this.getProxyEndpoints();

    //no targets for shared flows
    if(this.bundleTypeName !== bundleType.BundleType.SHAREDFLOW){
      this.endpoints = this.endpoints.concat(this.getTargetEndpoints());
    }
  }
  return this.endpoints;
};

Bundle.prototype.getResources = function() {
  if (!this.resources) {
    buildResources(this);
  }
  return this.resources;
};

Bundle.prototype.getPolicies = function() {
  if (!this.policies) {
    buildPolicies(this);
  }
  return this.policies;
};

Bundle.prototype.getFaultRules = function() {
  if (!this.faultRules) {
    //get them from the endpoints
    var faultRules = [];
    this.getEndpoints().forEach(function(ep) {
      faultRules = faultRules.concat(faultRules, ep.getFaultRules());
    });
    this.faultRules = faultRules;
  }
  return this.faultRules;
};

Bundle.prototype.getDefaultFaultRules = function() {
  if (!this.defaultFaultRules) {
    var defaultFaultRules = [];
    //get the defaultfaultrules from the endpoints
    this.getEndpoints().forEach(function(ep) {
      defaultFaultRules = defaultFaultRules.concat(
        defaultFaultRules,
        ep.getDefaultFaultRule()
      );
    });
    this.defaultFaultRules = defaultFaultRules;
  }
  return this.defaultFaultRules;
};

Bundle.prototype.summarize = function() {
  var summary = {
    report: this.getReport(),
    root: this.root,
    name: this.getName(),
    revision: this.getRevision(),
    policies: this.getPolicies()
  };

  summary.proxyEndpoints = [];
  if (this.getProxyEndpoints()) {
    this.getProxyEndpoints().forEach(function(ep) {
      summary.proxyEndpoints.push(ep.summarize());
    });
  }
  summary.targetEndpoints = [];
  if (this.getTargetEndpoints()) {
    this.getTargetEndpoints().forEach(function(ep) {
      summary.targetEndpoints.push(ep.summarize());
    });
  }

  summary.resources = [];
  if (this.getResources()) {
    this.getResources().forEach(function(re) {
      summary.resources.push(re.summarize());
    });
  }

  summary.policies = [];
  if (this.getPolicies()) {
    this.getPolicies().forEach(function(po) {
      summary.policies.push(po.summarize());
    });
  }

  return summary;
};

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

//Public
module.exports = Bundle;
