/*
  Copyright 2019-2023 Google LLC

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

const findFolders = require("./findFolders.js"),
  decompress = require("decompress"),
  fs = require("fs"),
  path = require("path"),
  Resource = require("./Resource.js"),
  Policy = require("./Policy.js"),
  Endpoint = require("./Endpoint.js"),
  xpath = require("xpath"),
  Dom = require("@xmldom/xmldom").DOMParser,
  bundleType = require("./BundleTypes.js"),
  debug = require("debug")("apigeelint:Bundle"),
  myUtil = require("./myUtil.js"),
  getcb = myUtil.curry(myUtil.diagcb, debug);

function _buildEndpoints(folder, tag, bundle, processFunction) {
  try {
    if (fs.existsSync(folder)) {
      fs.readdirSync(folder).forEach(function (proxyFile) {
        //can't be a directory
        //must end in .xml
        const fname = path.join(folder, proxyFile);
        if (proxyFile.endsWith(".xml") && fs.lstatSync(fname).isFile()) {
          const doc = xpath.select(
            tag,
            new Dom().parseFromString(fs.readFileSync(fname).toString())
          );
          doc.forEach((element) => processFunction(element, fname, bundle));
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
    processFunction = function (element, fname, bundle) {
      bundle.proxyEndpoints = bundle.proxyEndpoints || [];
      bundle.proxyEndpoints.push(new Endpoint(element, bundle, fname));
    };
  _buildEndpoints(folder, tag, bundle, processFunction);
}

function buildsharedflows(bundle) {
  var folder = bundle.proxyRoot + "/sharedflows/",
    tag = "SharedFlow",
    processFunction = function (element, fname, bundle) {
      bundle.proxyEndpoints = bundle.proxyEndpoints || [];
      bundle.proxyEndpoints.push(
        new Endpoint(element, bundle, fname, bundleType.BundleType.SHAREDFLOW)
      );
    };
  _buildEndpoints(folder, tag, bundle, processFunction);
}

function buildTargetEndpoints(bundle) {
  const folder = bundle.proxyRoot + "/targets/",
    tag = "TargetEndpoint",
    processFunction = function (element, fname, bundle) {
      bundle.targetEndpoints = bundle.targetEndpoints || [];
      bundle.targetEndpoints.push(new Endpoint(element, bundle, fname));
    };
  _buildEndpoints(folder, tag, bundle, processFunction);
}

function buildPolicies(bundle) {
  //get the list of policies and create the policy objects
  bundle.policies = [];
  if (fs.existsSync(bundle.proxyRoot + "/policies")) {
    fs.readdirSync(bundle.proxyRoot + "/policies").forEach(
      function (policyFile) {
        const ext = policyFile.split(".").pop();
        if (ext === "xml") {
          bundle.policies.push(
            new Policy(bundle.proxyRoot + "/policies", policyFile, bundle)
          );
        }
      }
    );
  }
}

function _buildResources(parent, path, resources) {
  // Append the resources found in the passed path.
  // If the path is a directory, then recurse.
  fs.readdirSync(path)
    .filter((file) => !["node_modules", ".DS_Store"].includes(file))
    .forEach(function (policyFile) {
      if (fs.statSync(path + "/" + policyFile).isDirectory()) {
        _buildResources(parent, path + "/" + policyFile, resources);
      } else if (!policyFile.endsWith("~")) {
        resources.push(
          new Resource(parent, path + "/" + policyFile, policyFile)
        );
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

Bundle.prototype.getElement = function () {
  // Read the contents of the file if it exists and return it raw.
  // There are cases where the filePath ends with /undefined, so
  // we don't want to attempt read a file that doesn't exist.
  const filePath = this.filePath;
  if (!this.element && fs.existsSync(filePath)) {
    debug(`getElement: filePath:${filePath}`);
    this.element = new Dom().parseFromString(
      fs.readFileSync(filePath).toString()
    );
  }
  return this.element;
};

Bundle.prototype.getName = function () {
  if (!this.name) {
    //look at the root of the proxy for the .xml file and get name from there
    try {
      const attr = xpath.select(`/${this.xPathName}/@name`, this.getElement());
      this.name = (attr[0] && attr[0].value) || "undefined";
    } catch (e) {
      this.name = "undefined";
    }
  }
  return this.name;
};

Bundle.prototype.getRevision = function () {
  if (!this.revision) {
    //look at the root of the proxy for the .xml file and get name from there
    try {
      const attr = xpath.select(
        `/${this.xPathName}/@revision`,
        this.getElement()
      );
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
  if (bundleName !== bundleType.BundleType.SHAREDFLOW) {
    buildTargetEndpoints(bundle);
  }
}

function processFileSystem(config, bundle, cb) {
  // build the bundle representation from file system.

  // Normalize the root path. Convert all path separator to forward slash.
  // This is used in error and warning messages.
  bundle.root = path.resolve(config.source.path).split(path.sep).join("/");

  // Populate the filepath by looking at the only .xml file
  // present at the bundle.root.
  const files = fs
    .readdirSync(bundle.root)
    .filter(
      (file) =>
        fs.lstatSync(path.join(bundle.root, file)).isFile() &&
        file.endsWith(".xml")
    );

  if (files.length > 1) {
    debug("More than one .xml file found at proxy root. Aborting.");
  }
  bundle.filePath = bundle.root + "/" + files[0];

  bundle.proxyRoot = bundle.root;
  const bundleTypeName = config.source.bundleType;

  //bundle.policies = [];
  //process.chdir(config.source.path);
  bundle.report = {
    filePath: myUtil.effectivePath(bundle.root, bundleTypeName),
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    messages: []
  };

  //only run for proxy or shared flow root
  if (!bundle.proxyRoot.endsWith(bundleTypeName)) {
    const folders = findFolders(bundleTypeName);
    //potentially have (apiproxy and target/apiproxy) or shared flow
    if (
      bundleTypeName == bundleType.BundleType.APIPROXY &&
      folders.includes("target/apiproxy")
    ) {
      //we prefer the target bundle when we have both
      //refactor to contains then walk through options
      bundle.proxyRoot = "target/apiproxy";
      buildAll(bundle, bundleTypeName);
    } else if (folders.includes(bundleTypeName)) {
      bundle.proxyRoot = bundleTypeName;
      buildAll(bundle, bundleTypeName);
    } else {
      //warn and be done
      bundle.addMessage({
        message:
          "No " +
          bundleTypeName +
          " folder found in: " +
          JSON.stringify(folders)
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
  const bundle = this;

  this.xPathName = bundleType.getXPathName(config.source.bundleType);
  this.bundleTypeName = config.source.bundleType;
  this.excluded = config.excluded;
  this.profile = config.profile;

  if (config.source.type === "ManagementServer") {
    //shared flow not implemented for management server
    if (config.source.bundleType === bundleType.BundleType.SHAREDFLOW) {
      throw "SharedFlows for management server not supported";
    }

    const ManagementServer = require("./ManagementServer.js"),
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
    const fileStream = fs.createWriteStream(tempFolder + "/apiproxy.zip");

    ms.get(
      "Bundle",
      { org },
      {
        api,
        revision,
        onRes: function (res) {
          if (res.statusCode === 200) {
            res.pipe(fileStream).on("close", function () {
              decompress(tempFolder + "/apiproxy.zip", tempFolder).then(
                (files) => {
                  //add the info to the config object here
                  config.source.path = tempFolder + "/apiproxy";
                  processFileSystem(config, bundle, cb);
                }
              );
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
      function (body) {
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

Bundle.prototype.getReport = function (cb) {
  // combine reports from endpoints, resources, policies

  const result = [this.report];
  const appendCollection = (collection) =>
    collection.forEach((item) => result.push(item.getReport()));

  appendCollection(this.getEndpoints()); // for either apiproxy or sharedflow
  appendCollection(this.getPolicies());
  appendCollection(this.getResources());

  // apply directives to optionally disable some errors/warnings
  result.forEach((item) => {
    if (item.messages && item.messages.length) {
      debug(`item ${item.filePath} has ${item.messages.length} messages`);
      const docElement = new Dom().parseFromString(
        fs.readFileSync(item.filePath).toString()
      ).documentElement;
      const directives = myUtil.findDirectives(docElement);
      debug(JSON.stringify(directives, null, 2));
      if (directives.length > 0) {
        const keep = (item) => {
          debug("checking " + JSON.stringify(item));
          const directivesForThisRule = directives.filter((directive) =>
            directive.disable.includes(item.ruleId)
          );
          /*
           * If there is a directive specifying the ruleId for this message
           * appears, and if it is on the line preceding where the error/warning
           * was flagged, or if there is no line number for the error/warning,
           * discard the it.
           **/
          return (
            directivesForThisRule.length == 0 ||
            (item.line &&
              !directivesForThisRule.find((d) => d.line + 1 == item.line)) ||
            (!item.line &&
              !directivesForThisRule.find((d) => d.line == 2 || d.line == 3))
          );
        };

        item.messages = item.messages.filter(keep);
        // update totals
        item.warningCount = item.messages.filter((m) => m.severity == 1).length;
        item.errorCount = item.messages.filter((m) => m.severity == 2).length;
      }
    }
  });

  if (cb) {
    cb(result);
  }
  return result;
};

Bundle.prototype.addMessage = function (msg) {
  if (msg.plugin) {
    msg.ruleId = msg.plugin.ruleId;
    if (!msg.severity) msg.severity = msg.plugin.severity;
    msg.nodeType = msg.plugin.nodeType;
    delete msg.plugin;
  }

  if (!msg.entity) {
    msg.entity = this;
  }
  if (!msg.source && msg.entity && typeof msg.entity.getSource == "function") {
    msg.source = msg.entity.getSource();
  }
  if (!msg.line && msg.entity && typeof msg.entity.getElement == "function") {
    let element = msg.entity.getElement();
    if (element) {
      msg.line = element.lineNumber;
    }
  }
  if (!msg.column && msg.entity && typeof msg.entity.getElement == "function") {
    let element = msg.entity.getElement();
    if (element) {
      msg.column = element.columnNumber;
    }
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

Bundle.prototype.getPolicyByName = function (pname) {
  return this.policies.find((policy) => policy.getName() === pname);
};

Bundle.prototype.onBundle = function (pluginFunction, cb) {
  pluginFunction(this, cb);
};

Bundle.prototype.onPolicies = function (pluginFunction, cb) {
  this.getPolicies().forEach((policy) =>
    pluginFunction(policy, getcb(`policy '${policy.getName()}'`))
  );
  cb(null, {});
};

Bundle.prototype.onSteps = function (pluginFunction, callback) {
  // there is no need to run the checks in parallel
  const bundle = this,
    proxies = bundle.getProxyEndpoints(),
    targets = bundle.getTargetEndpoints();
  debug(`onSteps: bundle name: '${bundle.getName()}'`);
  try {
    if (proxies && proxies.length > 0) {
      proxies.forEach((ep) =>
        ep.onSteps(
          pluginFunction,
          getcb(`STEP proxyendpoint '${ep.getName()}'`)
        )
      );
    } else {
      debug("no proxyEndpoints");
    }
    if (targets && targets.length > 0) {
      targets.forEach((ep) =>
        ep.onSteps(
          pluginFunction,
          getcb(`STEP targetendpoint '${ep.getName()}'`)
        )
      );
    } else {
      debug("no targetEndpoints");
    }
  } catch (exc1) {
    debug("exception: " + exc1);
    debug(exc1.stack);
  }
  callback(null, {});
};

Bundle.prototype.onConditions = function (pluginFunction, callback) {
  const bundle = this,
    proxies = bundle.getProxyEndpoints(),
    targets = bundle.getTargetEndpoints();
  debug(`onConditions: bundle name: '${bundle.getName()}'`);
  try {
    if (proxies && proxies.length > 0) {
      proxies.forEach((ep) =>
        ep.onConditions(
          pluginFunction,
          getcb(`COND proxyendpoint '${ep.getName()}'`)
        )
      );
    }
    if (targets && targets.length > 0) {
      targets.forEach((ep) =>
        ep.onConditions(
          pluginFunction,
          getcb(`COND targetendpoint '${ep.getName()}'`)
        )
      );
    }
  } catch (exc1) {
    debug("exception: " + exc1);
    debug(exc1.stack);
  }
  callback(null, {});
};

Bundle.prototype.onResources = function (pluginFunction, cb) {
  const bundle = this;
  if (bundle.getResources()) {
    bundle
      .getResources()
      .forEach((re) =>
        pluginFunction(re, getcb(`resource '${re.getFileName()}'`))
      );
  }
  cb(null, {});
};

Bundle.prototype.onFaultRules = function (pluginFunction, cb) {
  if (this.getFaultRules()) {
    this.getFaultRules().forEach(
      (fr) => fr && pluginFunction(fr, getcb(`faultrule '${fr.getName()}'`))
    );
  }
  cb(null, {});
};

Bundle.prototype.onDefaultFaultRules = function (pluginFunction, cb) {
  if (this.getDefaultFaultRules()) {
    this.getDefaultFaultRules().forEach(
      (dfr) => dfr && pluginFunction(dfr, getcb("defaultfaultrule"))
    );
  }
  cb(null, {});
};

Bundle.prototype.onProxyEndpoints = function (pluginFunction, cb) {
  const eps = this.getProxyEndpoints();
  if (eps && eps.length > 0) {
    eps.forEach((ep) =>
      pluginFunction(ep, getcb(`PEP proxyendpoint '${ep.getName()}'`))
    );
  }
  cb(null, {});
};

Bundle.prototype.onTargetEndpoints = function (pluginFunction, cb) {
  const eps = this.getTargetEndpoints();
  if (eps && eps.length > 0) {
    eps.forEach((ep) =>
      pluginFunction(ep, getcb(`TEP targetendpoint '${ep.getName()}'`))
    );
  }
  cb(null, {});
};

Bundle.prototype.getProxyEndpoints = function () {
  if (!this.proxyEndpoints) {
    if (this.bundleTypeName === bundleType.BundleType.SHAREDFLOW) {
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

Bundle.prototype.getTargetEndpoints = function () {
  if (!this.targetEndpoints) {
    buildTargetEndpoints(this);
    if (!this.targetEndpoints) {
      this.targetEndpoints = [];
    }
  }
  return this.targetEndpoints;
};

Bundle.prototype.getEndpoints = function () {
  if (!this.endpoints) {
    this.endpoints = this.getProxyEndpoints();

    //no targets for shared flows
    if (this.bundleTypeName !== bundleType.BundleType.SHAREDFLOW) {
      this.endpoints = this.endpoints.concat(this.getTargetEndpoints());
    }
  }
  return this.endpoints;
};

Bundle.prototype.getResources = function () {
  if (!this.resources) {
    buildResources(this);
  }
  return this.resources;
};

Bundle.prototype.getPolicies = function () {
  if (!this.policies) {
    buildPolicies(this);
  }
  return this.policies;
};

Bundle.prototype.getFaultRules = function () {
  if (!this.faultRules) {
    this.faultRules = this.getEndpoints().reduce(
      (a, ep) => [...a, ep.getFaultRules()],
      []
    );
  }
  return this.faultRules;
};

Bundle.prototype.getDefaultFaultRules = function () {
  if (!this.defaultFaultRules) {
    this.defaultFaultRules = this.getEndpoints().reduce(
      (a, ep) => [...a, ep.getDefaultFaultRule()],
      []
    );
  }
  return this.defaultFaultRules;
};

Bundle.prototype.summarize = function () {
  const summary = {
    report: this.getReport(),
    root: this.root,
    name: this.getName(),
    revision: this.getRevision(),
    policies: this.getPolicies(),
    proxyEndpoints: this.getProxyEndpoints()
      ? this.getProxyEndpoints().map((ep) => ep.summarize())
      : [],

    targetEndpoints: this.getTargetEndpoints()
      ? this.getTargetEndpoints().map((ep) => ep.summarize())
      : [],

    resources: this.getResources()
      ? this.getResources().map((re) => re.summarize())
      : [],

    policies: this.getPolicies()
      ? this.getPolicies().map((po) => po.summarize())
      : []
  };
  return summary;
};

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file) {
      const curPath = path + "/" + file;
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
