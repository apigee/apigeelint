/*
  Copyright © 2023-2025 Google LLC

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

const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");
const bundleType = require("./BundleTypes.js");
const debug = require("debug")("apigeelint:rc");

const locations = ["./", "~/"];

const untildify = (() => {
  const homedir = os.homedir();
  return (pathToResolve) =>
    homedir ? pathToResolve.replace(/^~(?=$|\/|\\)/, homedir) : pathToResolve;
})();

const findRc = (settingsfiles, sourcedir) => {
  const combine = (a, b) =>
    a.flatMap((ax) => b.map((bx) => untildify(path.join(ax, bx))));
  if (
    sourcedir.endsWith(bundleType.BundleType.SHAREDFLOW) ||
    sourcedir.endsWith(bundleType.BundleType.APIPROXY)
  ) {
    sourcedir = path.dirname(sourcedir);
  }

  return combine([sourcedir, ...locations], settingsfiles).find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
};

const readRc = (settingsfiles, sourcedir) => {
  const rcFile = findRc(settingsfiles, sourcedir);
  if (rcFile) {
    debug(`found rc file ${rcFile}`);
    const lines = fs
      .readFileSync(rcFile, "utf-8")
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("#"));
    return lines.reduce((a, line) => {
      if (line.startsWith("--")) {
        const [setting, value] = line.slice(2).split(" ", 2);
        a[setting] = value;
      }
      return a;
    }, {});
  }
};

module.exports = {
  readRc,
  findRc,
};
