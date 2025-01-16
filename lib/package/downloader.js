/*
  Copyright © 2024-2025 Google LLC

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

const fs = require("fs"),
  { Readable } = require("stream"),
  { finished } = require("stream/promises"),
  path = require("path"),
  tmp = require("tmp"),
  child_process = require("node:child_process"),
  debug = require("debug")("apigeelint:download");

const downloadBundle = async (downloadSpec) => {
  // 0. validate the input. it should be one of the following formats:
  let validSegmentExamples = [
    "org:ORGNAME",
    "api:APINAME",
    "sf:SHAREDFLOWNAME",
    "rev:REVISION",
    "env:ENVIRONMENT",
    "org:ORGNAME,sf:SHAREDFLOWNAME,rev:REVISION",
    "org:ORGNAME,sf:SHAREDFLOWNAME,env:ENVIRONMENT",
  ];

  const segments = downloadSpec.split(",");

  const invalidArgument = (casenum_for_diagnostics) => {
    console.log(
      `Invalid download argument (${downloadSpec}).\n` +
        "The value should be a set of 2 or more comma-separated segments of this form:\n  " +
        validSegmentExamples.join("\n  ") +
        "\n\n" +
        "Specify segments in any order. You must always specify the org.\n" +
        "Specify at least one of {api,sf}. Specify at most one of {rev,env}.\n" +
        "The token segment is optional. Multiple segments of the same type are not allowed.",
    );
    process.exit(1);
  };

  if (!segments || segments.length < 2 || segments.length > 4) {
    invalidArgument(1);
  }

  const processSegment = (acc, segment) => {
    const parts = segment.split(":");
    if (!parts || parts.length != 2) {
      invalidArgument(2);
    }
    switch (parts[0]) {
      case "org":
        if (acc.org || !parts[1]) {
          invalidArgument(4);
        }
        acc.org = parts[1];
        break;
      case "api":
      case "sf":
        if (acc.assetName || !parts[1]) {
          invalidArgument(5);
        }
        acc.assetName = parts[1];
        acc.assetFlavor = parts[0];
        break;
      case "rev":
        if (acc.revision || acc.environment || !parts[1]) {
          invalidArgument(6);
        }
        acc.revision = parts[1];
        break;
      case "env":
        if (acc.revision || acc.environment || !parts[1]) {
          invalidArgument(7);
        }
        acc.environment = parts[1];
        break;
      case "token":
        if (acc.token || !parts[1]) {
          invalidArgument(8);
        }
        acc.token = parts[1];
        break;
      default:
        invalidArgument(3);
        break;
    }
    return acc;
  };

  const digest = segments.reduce(processSegment, {});
  // make sure we got enough information
  if (!digest.assetName || !digest.assetFlavor || !digest.org) {
    invalidArgument(9);
  }

  try {
    // 1. figure the access token. Use the provided one, or try to get a new one
    // using gcloud, which may fail.
    const execOptions = {
      encoding: "utf8",
    };
    const accessToken =
      digest.token ||
      child_process.execSync("gcloud auth print-access-token", execOptions);

    // 2. set up some basic stuff.
    const collectionName = digest.assetFlavor == "api" ? "apis" : "sharedflows";
    const urlbase = `https://apigee.googleapis.com/v1/organizations/${digest.org}`;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const determineRevision = async () => {
      const rev = digest.revision,
        env = digest.environment;
      const getLatestRevision = async () => {
        const url = `${urlbase}/${collectionName}/${digest.assetName}/revisions`;
        const revisionsResponse = await fetch(url, { method: "GET", headers });
        if (!revisionsResponse.ok) {
          throw new Error(
            `HTTP error: ${revisionsResponse.status}, on GET ${url}`,
          );
        }
        const revisions = await revisionsResponse.json();
        revisions.sort((a, b) => a - b);
        return revisions[revisions.length - 1];
      };
      const getLatestDeployedRevision = async (environment) => {
        // find latest deployed revision in environment (could be more than one!)
        const url = `${urlbase}/environments/${environment}/${collectionName}/${digest.assetName}/deployments`;
        const deploymentsResponse = await fetch(url, {
          method: "GET",
          headers,
        });
        if (!deploymentsResponse.ok) {
          throw new Error(
            `HTTP error: ${deploymentsResponse.status}, on GET ${url}`,
          );
        }
        const r = await deploymentsResponse.json();
        // {
        //   "deployments": [
        //     {
        //       "environment": "eval",
        //       "apiProxy": "vjwt-b292612131",
        //       "revision": "3",
        //       "deployStartTime": "1695131144728",
        //       "proxyDeploymentType": "EXTENSIBLE"
        //     }
        //   ]
        // }
        if (!r.deployments || !r.deployments.length) {
          throw new Error(
            `That ${digest.assetFlavor} is not deployed in ${digest.environment}`,
          );
        }
        r.deployments.sort((a, b) => Number(a.revision) - Number(b.revision));
        return r.deployments[r.deployments.length - 1].revision;
      };

      if (rev && env) {
        // both revision or environment specified
        throw new Error("overspecified arguments"); // should never happen
      }

      if ((!rev && !env) || (rev && rev.toLowerCase() == "latest")) {
        // no revision or environment specified,
        // the keyword 'latest' is specified; get the latest revision (deployed or not).
        const rev = await getLatestRevision();
        console.log(`Downloading revision ${rev}`);
        return rev;
      }

      if (env) {
        // an environment is specified
        const rev = await getLatestDeployedRevision(env);
        console.log(`Downloading revision ${rev}`);
        return rev;
      }

      // a revision number is specified; return it.
      return rev;
    };

    // 3. determine the revision. Use the provided one, or select the right one.
    const revision = await determineRevision();

    // 4. export the revision.
    const url = `${urlbase}/${collectionName}/${digest.assetName}/revisions/${revision}?format=bundle`;
    const tmpdir = tmp.dirSync({
      prefix: `apigeelint-download-${digest.assetFlavor}`,
      keep: false,
      unsafeCleanup: true, // this does not seem to work in apigeelint
    });
    // make sure to cleanup when the process exits
    process.on("exit", function () {
      tmpdir.removeCallback();
    });

    const pathToDownloadedAsset = path.join(
      tmpdir.name,
      `${digest.assetName}-r${revision}.zip`,
    );

    const stream = fs.createWriteStream(pathToDownloadedAsset);
    const { body } = await fetch(url, { method: "GET", headers });
    await finished(Readable.fromWeb(body).pipe(stream));
    return pathToDownloadedAsset;
  } catch (ex) {
    // Possible causes: No gcloud cli found, or myriad other circumstances.
    // Show the error message and first line of stack trace.
    console.log(ex.stack.split("\n", 2).join("\n"));
    console.log("cannot download the bundle from Apigee. Cannot continue.");
    process.exit(1);
  }
};

module.exports = {
  downloadBundle,
};
