/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 * 
 * gcloud beta functions deploy lints --trigger-http --stage-bucket lintresults --memory 2048
 */

exports.lints = function lintResults(req, res) {
  const util = require("util");

  var customer,
    org,
    api,
    revision,
    authorization = req.get("Authorization"),
    formatter;

  if (req.method === "GET") {
    customer = req.query.customer;
    org = req.query.org;
    api = req.query.api;
    revision = req.query.revision;
    formatter = req.query.formatter;
  } else if (req.method === "POST") {
    customer = req.body.customer;
    org = req.body.organization;
    api = req.body.api;
    revision = req.body.revision;
    formatter = req.body.formatter;
  }

  //interpret the accepts header if the formatter was not explicitly supplied
  if (!formatter) {
    if (req.accepts("json")) {
      formatter = "json.js";
    } else if (req.accepts("xml")) {
      formatter = "jslint-xml.js";
    } else if (req.accepts("text")) {
      formatter = "unix.js";
    } else {
      formatter = "html.js";
    }
  }

  if (!org && customer) {
    //populate from the customer if supplied
    
    var str = '';
    
      var options = {
        host: 'nucleus-api-test.apigee.com',
        path: '/sfdc/account_orgs'
      };
    
      var callback = function(response) {
        response.on('data', function (chunk) {
          str += chunk;
        });
    
        response.on('end', function () {
          console.log(str);
          //str contains the payload from the account_orgs - parse to get the orgs to lint
          res.send(str); // SEND ACTUAL RESPONSE HERE
        });
      }
    
      var req = http.request(options, callback);
      req.end();
    
  }else{

  }

  if (!org || !api || !revision || !req.get("Authorization")) {
    // This is an error case, as "message" is required.
    res
      .status(400)
      .send(
        "org(" +
          org +
          "), api(" +
          api +
          "), and revision(" +
          revision +
          ") are required parameters and authorization header is required"
      );
  } else {
    // Everything is okay.

    const configuration = {
      source: {
        type: "ManagementServer",
        org,
        api,
        revision,
        authorization
      },
      output: function(report) {
        if (req.query.debug) {
          console.log(report);
        }
      },
      apiUpload: {
        destPath: "https://csdata-test.apigee.net/v1/lintresults",
        authorization,
        organization: org
      },
      formatter
    };

    var bl = require("./lib/package/bundleLinter.js");
    bl.lint(configuration, function(result, err) {
      if (err) {
        console.log(util.inspect(err, { showHidden: false, depth: 3 }));
        res.status(err.status).send(err.message);
      } else {
        res.status(200).send(result.apiUploadResponse);
      }
    });
  }
};
