//mgmtServerTargetEndpointCheck
//| &nbsp; |:white_medium_square:| TD001 | Mgmt Server as Target |  Discourage calls to the Management Server from a Proxy via target. |

var plugin = {
    ruleId: "TD001",
    name: "Discourage accessing management server from a proxy.",
    message: "Management server is intended for administrative tasks.",
    fatal: false,
    severity: 2, //error
    nodeType: "TargetEndpoint",
    enabled: true
  },
  debug = require("debug")("bundlelinter:" + plugin.name),
  xpath = require("xpath"),
  regexp = "(/v1/organizations/|enterprise.apigee.com)";

var onTargetEndpoint = function(target) {
  //get /TargetEndpoint/HTTPTargetConnection/URL
  var url = xpath.select(
    "/TargetEndpoint/HTTPTargetConnection/URL/text()",
    target.getElement()
  ), warnErr=false;

  if (url && url[0] && url[0].data.match(regexp)) {
    target.addMessage({
      plugin,
      message: "TargetEndpoint appears to be connecting to Management Server."
    });
    warnErr=true;
  }
  return warnErr;
};

module.exports = {
  plugin,
  onTargetEndpoint
};
