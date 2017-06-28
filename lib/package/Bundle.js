//Policy.js

//Private
var myUtil = require("./myUtil.js"),
  FindFolder = require("node-find-folder"),
  fs = require("fs"),
  path = require("path"),
  Resource = require("./Resource.js"),
  Policy = require("./Policy.js"),
  Endpoint = require("./Endpoint.js"),
  bundlePath;

function buildProxyEndpoints(bundle) {
  var folder = bundle.proxyRoot + "/proxies/",
    tag = "ProxyEndpoint",
    processFunction = function(element, fname, bundle) {
      bundle.proxyEndpoints = bundle.proxyEndpoints || [];
      bundle.proxyEndpoints.push(new Endpoint(element, bundle, fname));
    };
  myUtil.processTagsFromFolder(folder, tag, bundle, processFunction);
}

function buildTargetEndpoints(bundle) {
  var folder = bundle.proxyRoot + "/targets/",
    tag = "TargetEndpoint",
    processFunction = function(element, fname, bundle) {
      bundle.targetEndpoints = bundle.targetEndpoints || [];
      bundle.targetEndpoints.push(new Endpoint(element, bundle, fname));
    };
  myUtil.processTagsFromFolder(folder, tag, bundle, processFunction);
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
    //console.log("setting root to: " + path.resolve(config.source.path));
    bundle.root = path.resolve(config.source.path);
    bundle.proxyRoot = bundle.root;
    bundle.policies = [];
    bundle.messages = { warnings: [], errors: [] };
    bundle.warn = function(msg) {
      return this.messages.warnings.push(msg);
    };
    bundle.err = function(msg) {
      return this.messages.errors.push(msg);
    };
    process.chdir(config.source.path);

    var folders = new FindFolder("target/apiproxy");
    folders.some(function(folder) {
      if (folder.indexOf("target/apiproxy") != -1) {
        bundle.proxyRoot = folder;
        return;
      }
    });

    buildResources(bundle);
    buildPolicies(bundle);
    buildProxyEndpoints(bundle);
    buildTargetEndpoints(bundle);
  }
};

function Bundle(config) {
  init.config(config, this);
}

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
      fr.onFaultRules(pluginFunction);
    });
};

Bundle.prototype.onDefaultFaultRules = function(pluginFunction) {
  this.getDefaultFaultRules() &&
    this.getDefaultFaultRules().onDefaultFaultRule(pluginFunction);
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
  }
  return this.proxyEndpoints;
};

Bundle.prototype.getTargetEndpoints = function() {
  if (!this.targetEndpoints) {
    buildTargetEndpoints(this);
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
    messages: this.messages,
    root: this.root
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
