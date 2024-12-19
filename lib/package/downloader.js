/*
  Copyright © 2024 Google LLC

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
  // 0. validate the input. it should be org:ORGNAME,api:APINAME or org:ORGNAME,sf:SHAREDFLOWNAME
  let parts = downloadSpec.split(",");
  let invalidArgument = () => {
    console.log(
      "Specify the value in the form org:ORGNAME,api:APINAME or org:ORGNAME,sf:SHAREDFLOWNAME",
    );
    process.exit(1);
  };
  if (!parts || (parts.length != 2 && parts.length != 3)) {
    invalidArgument();
  }
  let orgparts = parts[0].split(":");
  if (!orgparts || orgparts.length != 2 || orgparts[0] != "org") {
    invalidArgument();
  }
  let assetparts = parts[1].split(":");
  if (!assetparts || assetparts.length != 2) {
    invalidArgument();
  }
  if (assetparts[0] != "api" && assetparts[0] != "sf") {
    invalidArgument();
  }

  let providedToken = null;
  if (parts.length == 3) {
    let tokenParts = parts[2].split(":");
    if (!tokenParts || tokenParts.length != 2 || tokenParts[0] != "token") {
      invalidArgument();
    }
    providedToken = tokenParts[1];
  }

  const execOptions = {
    // cwd: proxyDir, // I think i do not care
    encoding: "utf8",
  };
  try {
    // 1. use the provided token, or get a new one using gcloud. This may fail.
    let accessToken =
      providedToken ||
      child_process.execSync("gcloud auth print-access-token", execOptions);
    // 2. inquire the revisions
    let flavor = assetparts[0] == "api" ? "apis" : "sharedflows";
    const urlbase = `https://apigee.googleapis.com/v1/organizations/${orgparts[1]}/${flavor}`;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    let url = `${urlbase}/${assetparts[1]}/revisions`;
    let revisionsResponse = await fetch(url, { method: "GET", headers });

    // 3. export the latest revision
    if (!revisionsResponse.ok) {
      throw new Error(`HTTP error: ${revisionsResponse.status}, on GET ${url}`);
    }
    const revisions = await revisionsResponse.json();
    revisions.sort();
    const rev = revisions[revisions.length - 1];
    url = `${urlbase}/${assetparts[1]}/revisions/${rev}?format=bundle`;

    const tmpdir = tmp.dirSync({
      prefix: `apigeelint-download-${assetparts[0]}`,
      keep: false,
    });
    const pathToDownloadedAsset = path.join(
      tmpdir.name,
      `${assetparts[1]}-rev${rev}.zip`,
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
