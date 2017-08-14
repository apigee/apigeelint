/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.lints = function lintResults(req, res) {
  var org, api, revision, authorization=req.get("Authorization"), formatter;
  if (req.method === "GET") {
  } else if (req.method === "POST") {
  }
  //look at interpretting the accepts header if the formatter was not explicitly supplied

  if (
    req.method === "GET" &&
    (!req.query.org ||
      !req.query.api ||
      !req.query.revision ||
      !req.get("Authorization"))
  ) {
    // This is an error case, as "message" is required.
    res
      .status(400)
      .send(
        "org(" +
          req.query.org +
          "), api(" +
          req.query.api +
          "), and revision(" +
          req.query.revision +
          ") are required parameters and authorization header(" +
          req.get("Authorization") +
          ") is required"
      );
  } else {
    // Everything is okay.

    const configuration = {
      source: {
        type: "ManagementServer",
        org: req.query.org,
        api: req.query.api,
        revision: req.query.revision,
        authorization: req.get("Authorization")
      },
      output: function(report) {
        res.status(200).send(report);
      },
      apiUpload: {
        destPath: "https://csdata-test.apigee.net/v1/lintresults",
        authorization: req.get("Authorization"),
        organization: req.query.org
      },
      formatter: req.query.formatter || "html.js"
    };

    var bl = require("./lib/package/bundleLinter.js");
    bl.lint(configuration);
  }
};
