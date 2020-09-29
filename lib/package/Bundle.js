/*
  Copyright 2019-2020 Google LLC

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

const FindFolder = require("node-find-folder"),
      decompress = require("decompress"),
      fs = require("fs"),
      path = require("path"),
      Resource = require("./Resource.js"),
      Policy = require("./Policy.js"),
      Endpoint = require("./Endpoint.js"),
      xpath = require("xpath"),
      Dom = require("xmldom").DOMParser,
      bundleType = require('./BundleTypes.js'),
      util = require("util"),
      debug = require("debug")("apigeelint:Bundle"),
      myUtil = require("./myUtil.js"),
      getcb = myUtil.curry(myUtil.diagcb, debug);

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
      bundle.proxyEndpoints.push(new Endpoint(element, bundle, fname, bundleType.BundleType.SHAREDFLOW));
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
    if(config.source.bundleType === bundleType.BundleType.SHAREDFLOW){
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
    if (!msg.severity) msg.severity = msg.plugin.severity;
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

Bundle.prototype.onPolicies = function(pluginFunction, cb) {
  this.getPolicies().forEach(policy =>
      pluginFunction(policy, getcb(`policy '${policy.getName()}'`)));
  cb(null, {});
};

Bundle.prototype.onSteps = function(pluginFunction, callback) {
  // there is no need to run the checks in parallel
  const bundle = this,
        proxies = bundle.getProxyEndpoints(),
        targets = bundle.getTargetEndpoints();
  debug(`onSteps: bundle name: '${bundle.getName()}'`);
  try {
    if (proxies && proxies.length>0) {
      proxies.forEach(ep => ep.onSteps(pluginFunction, getcb(`proxyendpoint '${ep.getName()}'`)));
    } else {
      debug("no proxyEndpoints");
    }
    if (targets && targets.length>0) {
      targets.forEach(ep => ep.onSteps(pluginFunction, getcb(`targetendpoint '${ep.getName()}'`)));
    } else {
      debug("no targetEndpoints");
    }
  }
  catch (exc1) {
    debug('exception: ' + exc1);
    debug(exc1.stack);
  }
  callback(null, {});
};

Bundle.prototype.onConditions = function(pluginFunction, callback) {
  const bundle = this,
        proxies = bundle.getProxyEndpoints(),
        targets = bundle.getTargetEndpoints();
  debug(`onConditions: bundle name: '${bundle.getName()}'`);
  try {
    if (proxies && proxies.length>0) {
      proxies.forEach(ep =>
                      ep.onConditions(pluginFunction, getcb(`proxyendpoint '${ep.getName()}'`)));
    }
    if (targets && targets.length > 0) {
      targets.forEach(ep =>
                      ep.onConditions(pluginFunction, getcb(`targetendpoint '${ep.getName()}'`)));
    }
  }
  catch (exc1) {
    debug('exception: ' + exc1);
    debug(exc1.stack);
  }
  callback(null, {});
};

Bundle.prototype.onResources = function(pluginFunction, cb) {
  const bundle = this;
  if (bundle.getResources()) {
    bundle.getResources().forEach(re =>
        pluginFunction(re, getcb(`resource '${re.getFileName()}'`)));
  }
  cb(null, {});
};

Bundle.prototype.onFaultRules = function(pluginFunction, cb) {
  const bundle = this;
  if (bundle.getFaultRules()) {
    bundle.getFaultRules().forEach(fr =>
                                   fr && pluginFunction(fr, getcb(`faultrule '${fr.getName()}'`)));
  }
  cb(null, {});
};

Bundle.prototype.onDefaultFaultRules = function(pluginFunction, cb) {
  const bundle = this;
  if (bundle.getDefaultFaultRules()) {
    bundle.getDefaultFaultRules().forEach(dfr =>
                                          dfr && pluginFunction(dfr, getcb('defaultfaultrule')));
  }
  cb(null, {});
};

Bundle.prototype.onProxyEndpoints = function(pluginFunction, cb) {
  let eps = this.getProxyEndpoints();
  if (eps && eps.length > 0) {
    eps.forEach( ep =>
                 pluginFunction(ep, getcb(`proxyendpoint '${ep.getName()}'`)));
  }
  cb(null, {});
};

Bundle.prototype.onTargetEndpoints = function(pluginFunction, cb) {
  let eps = this.getTargetEndpoints();
  if (eps && eps.length > 0) {
    eps.forEach( ep =>
                 pluginFunction(ep, getcb(`targetendpoint '${ep.getName()}'`)));
  }
  cb(null, {});
};

Bundle.prototype.getProxyEndpoints = function() {
  if (!this.proxyEndpoints) {
    if(this.bundleTypeName === bundleType.BundleType.SHAREDFLOW){
      buildsharedflows(this);
    } else {
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
