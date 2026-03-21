/*
Copyright 2019-2024, 2026 Google LLC

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

const ruleId = require("../lintUtil.js").getRuleId(),
  util = require("util"),
  path = require("node:path"),
  xpath = require("xpath"),
  debug = require("debug")("apigeelint:" + ruleId);

const plugin = {
  ruleId,
  name: "Check for unreferenced resources",
  message:
    "Unreferenced resources are dead code; should be removed from bundles.",
  fatal: false,
  severity: 1, //1=warn, 2=error
  nodeType: "Bundle",
  enabled: true,
};

const validResourceTypesForBoth = [
  "jsc",
  "java",
  "py",
  "xsl",
  "wsdl",
  "xsd",
  "oas",
];

const profileMappings = {
  apigeex: ["properties", "graphql"],
  apigee: ["node", "hosted", "template"],
};

const onBundle = function (bundle, cb) {
  const validResourceTypes = [];
  validResourceTypes.push.apply(validResourceTypes, validResourceTypesForBoth);
  validResourceTypes.push.apply(
    validResourceTypes,
    profileMappings[bundle.profile || "apigee"],
  );

  debug(`validResourceTypes: ${util.format(validResourceTypes)}`);

  const resources = bundle.getResources(),
    policies = bundle.getPolicies();

  debug(`resources: ${util.format(resources)}`);
  let flagged = false;
  if (resources.length) {
    resources.forEach((resource, rix) => {
      debug(`resource(${rix}): ${resource.path} ${resource.fname}`);
      const marker = path.normalize("apiproxy/resources/"),
        ix = resource.path.lastIndexOf(marker);
      if (ix < 0) {
        return;
      }
      const trailingPath = resource.path.substr(ix + marker.length),
        parts = trailingPath.split(path.sep),
        rtype = parts[0],
        rshortname = parts.slice(1).join("/"); // not path.sep!
      debug(
        `trailingPath(${trailingPath})  rtype(${rtype}) rshortname(${rshortname})`,
      );
      if (!rshortname) {
        debug(`no resource shortname.`);
        return;
      }
      if (!validResourceTypes.includes(rtype)) {
        debug(`${rtype} is not a valid resource type, punt.`);
        return;
      }

      let found = false;
      if (rtype == "java") {
        /*
         * Handle Java resources specially.
         *
         * We cannot tell by static analysis at this level if a specific Java
         * jar will be used by any particular JavaCallout policy.  But we can
         * tell if there is no JavaCallout policy, in which case we can be
         * sure that every jar is unreferenced.
         **/
        found = policies.find((policy) => policy.getType() == "JavaCallout");
      } else if (rtype == "properties") {
        /*
         * Punt on properties resources.
         *
         * The runtime sets variables with the contents of the
         * properties file. We cannot tell if these variables are used
         * by Java callouts, JS, or even sharedflows.
         **/
        found = true;
      } else {
        found = policies.find((policy, _pix) => {
          const ptype = policy.getType();
          /*
           * Any text resource can be included in an AssignMessage/AssignVariable
           * or RaiseFault/FaultResponse/AssignVariable .
           **/
          if (ptype == "AssignMessage" || ptype == "RaiseFault") {
            const pathPrefix =
              ptype == "AssignMessage"
                ? "AssignMessage"
                : "RaiseFault/FaultResponse";
            const rsrcUrls = xpath.select(
              `/${pathPrefix}/AssignVariable/ResourceURL/text()`,
              policy.getElement(),
            );

            debug(
              `AM|RF ${policy.getName()} rsrcUrls: ${util.format(rsrcUrls)}`,
            );

            // check any/all
            return rsrcUrls.find(
              (rsrcUrl) => rsrcUrl.data == `${rtype}://${rshortname}`,
            );
          }

          // now do checks for specific resource types
          const findit = (path1) => {
            const rsrcUrls = xpath.select(path1, policy.getElement());
            debug(
              `${policy.getType()} ${policy.getName()} Urls: ${util.format(rsrcUrls)}`,
            );
            // check the first one. In this function, there should be only one.
            return (
              rsrcUrls &&
              rsrcUrls.length &&
              rsrcUrls[0].data == `${rtype}://${rshortname}`
            );
          };

          // handle jsc specially, because of IncludeURL
          if (rtype == "jsc" && ptype == "Javascript") {
            const rsrcUrls = xpath.select(
              `/Javascript/IncludeURL/text()`,
              policy.getElement(),
            );
            // check any/all
            debug(
              `JS ${policy.getName()} IncludeUrls: ${util.format(rsrcUrls)}`,
            );

            return (
              rsrcUrls.find(
                (rsrcUrl) => rsrcUrl.data == `jsc://${rshortname}`,
              ) || findit(`/Javascript/ResourceURL/text()`)
            );
          }

          // all others
          const rtypeMappings = {
            xsl: { xpath: "ResourceURL/text()", ptype: "XSL" },
            oas: {
              xpath: "OASResource/text()",
              ptype: "OASValidation",
            },
            py: { xpath: `ResourceURL/text()`, ptype: "Script" },
            xsd: {
              xpath: "ResourceURL/text()",
              ptype: "MessageValidation",
            },
            wsdl: {
              xpath: "ResourceURL/text()",
              ptype: "MessageValidation",
            },
            graphql: {
              xpath: "ResourceURL/text()",
              ptype: "GraphQL",
            },
          };
          if (rtypeMappings[rtype]) {
            return (
              ptype == rtypeMappings[rtype].ptype &&
              findit(`/${ptype}/${rtypeMappings[rtype].xpath}`)
            );
          }

          return false; // not found
        });
      }

      if (!found) {
        flagged = true;
        debug(`unreferenced: ${resource.fname}`);
        bundle.addMessage({
          plugin,
          entity: resource,
          message: `Unreferenced resource ${rtype}/${resource.fname}. There are no policies that reference this resource.`,
        });
      }
    });
  }
  if (typeof cb == "function") {
    cb(null, flagged);
  }
};

module.exports = {
  plugin,
  onBundle,
};
