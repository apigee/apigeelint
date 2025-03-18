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
  // 0. validate the input. it should combine 2 or more of the following formats:
  let validSegmentExamples = [
    "org:ORGNAME",
    "api:APINAME",
    "sf:SHAREDFLOWNAME",
    "rev:REVISION",
    "env:ENVIRONMENT",
    "token:TOKEN",
  ];

  const segments = downloadSpec.split(",");

  const invalidArgument = (message) => {
    console.log(
      `Error: Invalid download argument (${downloadSpec}).\n` +
        `${message}\n` +
        "The value should be a set of 2 or more comma-separated segments of this form:\n  " +
        validSegmentExamples.join("\n  ") +
        "\n\n" +
        "Specify segments in any order. You must always specify the org.\n" +
        "Specify exactly one of {api,sf}. Specify at most one of {rev,env}.\n" +
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
      invalidArgument(`Incorrect structure: ${segment}`);
    }
    const [key, value] = parts;

    if (!value) {
      invalidArgument(`Missing value for key: ${key} in segment: ${segment}`);
    }
    switch (key) {
      case "token":
      case "org":
        if (acc[key]) {
          invalidArgument(`You may specify ${key} at most once`);
        }
        acc[key] = value;
        break;
      case "api":
      case "sf":
        if (acc.api || acc.sf) {
          invalidArgument(`You must specify exactly one of {api,sf}`);
        }
        acc[key] = value;
        break;
      case "rev":
      case "env":
        if (acc.rev || acc.env || !parts[1]) {
          invalidArgument(`You may specify at most one of {rev,env}`);
        }
        acc[key] = value;
        break;
      default:
        invalidArgument(`unrecognized parameter: ${key}`);
    }
    return acc;
  };

  const digest = segments.reduce(processSegment, {});
  // make sure we got enough information
  if ((!digest.api && !digest.sf) || !digest.org) {
    invalidArgument("incomplete parameters for download");
  }

  if (digest.rev && digest.env) {
    // both revision or environment specified; should never happen.
    invalidArgument("overspecified parameters for download (bothrev and env)");
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
    const collectionName = digest.api ? "api" : "sharedflow",
      rev = digest.rev,
      env = digest.env,
      assetName = digest.sf || digest.api,
      urlbase = `https://apigee.googleapis.com/v1/organizations/${digest.org}`,
      headers = {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

    const determineRevision = async () => {
      const getLatestRevision = async () => {
        const url = `${urlbase}/${collectionName}s/${assetName}/revisions`;
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
        // verify that the environment exists
        let url = `${urlbase}/environments/${environment}`;
        const envResponse = await fetch(url, { method: "GET", headers });
        if (envResponse.status == 404) {
          throw new Error(
            `The environment ${environment} does not appear to exist`,
          );
        }
        if (!envResponse.ok) {
          throw new Error(
            `cannot inquire environment ${environment}, on GET ${url}`,
          );
        }

        url = `${urlbase}/environments/${environment}/${collectionName}s/${assetName}/deployments`;
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
            `That ${collectionName} is not deployed in ${environment}`,
          );
        }
        r.deployments.sort((a, b) => Number(a.revision) - Number(b.revision));
        return r.deployments[r.deployments.length - 1].revision;
      };

      if ((!rev && !env) || (rev && rev.toLowerCase() == "latest")) {
        // no revision or environment specified,
        // the keyword 'latest' is specified; get the latest revision (deployed or not).
        const rev = await getLatestRevision();
        console.log(`Downloading revision ${rev}`);
        return Number(rev);
      }

      if (env) {
        // an environment is specified
        const rev = await getLatestDeployedRevision(env);
        console.log(`Downloading revision ${rev}`);
        return Number(rev);
      }

      // a revision number is specified; return it.
      return !isNaN(rev) && Number(rev);
    };

    // 3. determine the revision. Use the provided one, or select the right one.
    const revision = await determineRevision();

    if (!revision || revision < 0) {
      throw new Error(`Invalid revision number`);
    }
    // 4. verify that the revision exists
    let url = `${urlbase}/${collectionName}s/${assetName}/revisions/${revision}`;
    const revisionResponse = await fetch(url, { method: "GET", headers });
    if (revisionResponse.status == 404) {
      throw new Error(
        `Revision ${revision} of ${collectionName} ${assetName} does not appear to exist`,
      );
    }
    if (!revisionResponse.ok) {
      throw new Error(
        `cannot inquire revision ${revision} of ${collectionName} ${assetName}, on GET ${url}`,
      );
    }

    // 5. export the revision.
    url = `${urlbase}/${collectionName}s/${assetName}/revisions/${revision}?format=bundle`;
    const tmpdir = tmp.dirSync({
      prefix: `apigeelint-download-${collectionName}`,
      keep: false,
      unsafeCleanup: true, // this does not seem to work in apigeelint
    });
    // make sure to cleanup when the process exits
    process.on("exit", function () {
      tmpdir.removeCallback();
    });

    const pathToDownloadedAsset = path.join(
      tmpdir.name,
      `${assetName}-r${revision}.zip`,
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
