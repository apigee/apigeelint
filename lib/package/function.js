/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.lints = function lintResults(req, res) {
  if (
    !req.query.org ||
    !req.query.api ||
    !req.query.revision ||
    !req.get("Authorization")
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
    var result;

    const configuration = {
      source: {
        type: "ManagementServer",
        org: req.query.org,
        api: req.query.api,
        revision: req.query.revision,
        authorization: req.get("Authorization")
      },
      output: function(output) {
        res.status(200).send(output);
      }
    };

    var bl = require("./node_modules/apigeelint/lib/package/bundleLinter.js");
    bl.lint(configuration);
  }
};
