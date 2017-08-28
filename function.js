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

  var org,
    api,
    revision,
    authorization = req.get("Authorization"),
    formatter;
  if (req.method === "GET") {
    org = req.query.org;
    api = req.query.api;
    revision = req.query.revision;
    formatter = req.query.formatter;
  } else if (req.method === "POST") {
    org = req.body.organization;
    api = req.body.api;
    revision = req.body.revision;
    formatter = req.body.formatter;
  }

  //look at interpretting the accepts header if the formatter was not explicitly supplied

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
        res.status(200).send(report);
      },
      apiUpload: {
        destPath: "https://csdata-test.apigee.net/v1/lintresults",
        authorization,
        organization: org
      },
      formatter: formatter || "html.js"
    };

    var bl = require("./lib/package/bundleLinter.js");
    bl.lint(configuration, function(result, err) {
      if(err){
        console.log(util.inspect(err, { showHidden: false, depth: 3 }));
        res.status(err.status).send(err.message);
      }
    });
  }
};
