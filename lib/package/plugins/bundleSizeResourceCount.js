//bundleSizeResourceCount
//| &nbsp; |:white_medium_square:| BN007 | Bundle size - resource callouts. |  Large bundles are a symptom of poor design. A high number of resource callouts is indicative of underutilizing out of the box Apigee policies. |

var plugin = {
    ruleId: "BN007",
    name:
      "Check number of resources present in the bundle as a gauge of bundle size",
    message:
      "Large bundles are a symptom of poor design. A high number of resource callouts is indicative of underutilizing out of the box Apigee policies or over orchestration in the API tier.",
    fatal: false,
    severity: 1, //warn
    nodeType: "Bundle",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name);

var onBundle = function(bundle, cb) {
  var limit = 20,
    resources = bundle.getResources(),
    hadWarnErr = false;

  if (resources.length > limit) {
    bundle.addMessage({
      plugin,
      message:
        "More (" +
        resources.length +
        ") than recommended resources (" +
        limit +
        ") in bundle."
    });
    hadWarnErr = true;
  }
  if (typeof(cb) == 'function') {
    cb(hadWarnErr);
  }
  return hadWarnErr;
};

module.exports = {
  plugin,
  onBundle
};
