// apigeelintrc.js
// ------------------------------------------------------------------
//
// created: Mon Apr 15 18:14:54 2024
// last saved: <2024-April-16 13:54:37>

/* jshint esversion:9, node:true, strict:implied */
/* global process, console, Buffer */

const os = require("os");
const fs = require("fs");
const path = require("path");
const bundleType = require("./BundleTypes.js");

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
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()
  );
};

const readRc = (settingsfiles, sourcedir) => {
  const rcFile = findRc(settingsfiles, sourcedir);
  if (rcFile) {
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
  findRc
};
