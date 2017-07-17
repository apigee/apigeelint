//Policy.js

//Private
var FindFolder = require("node-find-folder"),
  fs = require("fs"),
  path = require("path"),
  Resource = require("./Resource.js"),
  Policy = require("./Policy.js"),
  Endpoint = require("./Endpoint.js"),
  xpath = require("xpath"),
  Dom = require("xmldom").DOMParser,
  debug = require("debug")("bundlelinter:Bundle");

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
  files.forEach(function(policyFile) {
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
    console.log(this.filePath);
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
      var attr = xpath.select("APIProxy/@name", this.getElement());
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
      var attr = xpath.select("APIProxy/@revision", this.getElement());
      this.revision = (attr[0] && attr[0].value) || "undefined";
    } catch (e) {
      this.revision = "undefined";
    }
  }
  return this.name;
};

var init = {
  config(config, bundle) {
    //lets preload the bundle structure here
    this[config.source.type](config, bundle);
  },
  filesystem(config, bundle) {
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
      throw new Error("More than one .xml file found at proxy root. Aborting.");
    } else {
      bundle.filePath = files[0];
    }

    bundle.proxyRoot = bundle.root;
    bundle.policies = [];
    process.chdir(config.source.path);
    bundle.report = {
      filePath: bundle.root,
      errorCount: 0,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      messages: []
    };

    if (!bundle.proxyRoot.endsWith("apiproxy")) {
      var folders = new FindFolder("apiproxy");
      //potentially have apiproxy and target/apiproxy
      //we prefer the target bundle when we have both
      //refactor to contains then walk through options
      //throw an error if no apiproxy found
      if (folders.includes("target/apiproxy")) {
        bundle.proxyRoot = "target/apiproxy";
      } else if (folders.includes("apiproxy")) {
        bundle.proxyRoot = "apiproxy";
      } else {
        throw new Error("No apiproxy folder found.");
      }
    }

    buildResources(bundle);
    buildPolicies(bundle);
    buildProxyEndpoints(bundle);
    buildTargetEndpoints(bundle);
  }
};

function Bundle(config) {
  init.config(config, this);
}

Bundle.prototype.getReport = function() {
  //go out and getReport from endpoints, resources, policies
  var result = [this.report],
    append = function(a) {
      a.forEach(function(e) {
        result.push(e.getReport());
      });
    };
  append(this.getEndpoints());
  append(this.getPolicies());
  append(this.getResources());

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
  if (!msg.hasOwnProperty("source") && msg.entity.hasOwnProperty("getSource")) {
    msg.source = msg.entity.getSource();
  }
  if (!msg.hasOwnProperty("line") && msg.entity.hasOwnProperty("getElement")) {
    msg.line = msg.entity.getElement().lineNumber;
  }
  if (
    !msg.hasOwnProperty("column") &&
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
      this.report.warningCount++;
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

Bundle.prototype.onResources = function(pluginFunction) {
  if (this.resources) {
    this.resources.forEach(pluginFunction);
  }
};

Bundle.prototype.onPolicies = function(pluginFunction) {
  if (this.policies) {
    this.policies.forEach(pluginFunction);
  }
};

Bundle.prototype.onSteps = function(pluginFunction) {
  this.getProxyEndpoints() &&
    this.getProxyEndpoints().forEach(function(ep) {
      ep.onSteps(pluginFunction);
    });
  this.getTargetEndpoints() &&
    this.getTargetEndpoints().forEach(function(ep) {
      ep.onSteps(pluginFunction);
    });
};

Bundle.prototype.onConditions = function(pluginFunction) {
  this.getProxyEndpoints() &&
    this.getProxyEndpoints().forEach(function(ep) {
      ep.onConditions(pluginFunction);
    });
  this.getTargetEndpoints() &&
    this.getTargetEndpoints().forEach(function(ep) {
      ep.onConditions(pluginFunction);
    });
};

Bundle.prototype.onResources = function(pluginFunction) {
  this.getResources() &&
    this.getResources().forEach(function(re) {
      re.onResources(pluginFunction);
    });
};

Bundle.prototype.onFaultRules = function(pluginFunction) {
  this.getFaultRules() &&
    this.getFaultRules().forEach(function(fr) {
      fr && fr.onFaultRules(pluginFunction);
    });
};

Bundle.prototype.onDefaultFaultRules = function(pluginFunction) {
  this.getDefaultFaultRules() &&
    this.getDefaultFaultRules().forEach(function(dfr) {
      dfr && pluginFunction(dfr);
    });
};

Bundle.prototype.onProxyEndpoints = function(pluginFunction) {
  var eps = this.getProxyEndpoints();
  if (eps) {
    eps.forEach(function(ep) {
      pluginFunction(ep);
    });
  }
};

Bundle.prototype.onTargetEndpoints = function(pluginFunction) {
  var eps = this.getTargetEndpoints();
  if (eps) {
    eps.forEach(function(ep) {
      pluginFunction(ep);
    });
  }
};

Bundle.prototype.getProxyEndpoints = function() {
  if (!this.proxyEndpoints) {
    buildProxyEndpoints(this);
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
    this.endpoints.concat(this.getTargetEndpoints());
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
    revision: this.getRevision()
    //policies: this.policies
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

//Public
module.exports = Bundle;
