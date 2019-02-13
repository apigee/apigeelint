/*
  Copyright 2019 Google LLC

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

//module to allow for interaction with mgmt server
const decompress = require("decompress"),
  fs = require("fs"),
  bl = require("./bundleLinter.js"),
  ManagementServer = require("./ManagementServer.js");

var apis = [],
  org = "davidwallen2014",
  tempFolder = "./tmp/",
  serial = 0,
  rootDir = process.cwd(),
  completed = {};

readCompletedFile();

deleteFolderRecursive(tempFolder);
fs.mkdirSync(tempFolder);
var ms = new ManagementServer(org);

ms.get("OrgAPIs", { org }, [], function(body, res) {
  function handleAPI(index) {
    var revisions = [];
    index = index || 0;
    if (index < apis.length) {
      var api = apis[index];

      function handleRevision(revIndex) {
        revIndex = revIndex || 0;
        if (revIndex < revisions.length) {
          var revision = revisions[revIndex];
          if (!isCompleted(ms, org, api, revision)) {
            var proxyDir =
              tempFolder + org + "-" + api + "-" + revision + "-" + serial++;
            fs.mkdirSync(proxyDir);
            var fileStream = fs.createWriteStream(proxyDir + "/apiproxy.zip");

            ms.get(
              "Bundle",
              { org },
              {
                api,
                revision,
                onRes: function(res, aConfig) {
                  if (res.statusCode === 200) {
                    res.pipe(fileStream).on("close", function() {
                      console.log("starting lint of " + proxyDir);
                      decompress(
                        proxyDir + "/apiproxy.zip",
                        proxyDir
                      ).then(files => {
                        bl.lint(
                          {
                            source: {
                              type: "filesystem",
                              path: proxyDir + "/apiproxy/"
                            },
                            apiUpload: {
                              destPath:
                                "https://csdata-test.apigee.net/v1/lintresults",
                              authorization: ms.getAuthorization(),
                              organization: aConfig.org
                            },
                            output: function(msg) {
                              fs.writeFile(
                                tempFolder +
                                  "/" +
                                  org +
                                  "-" +
                                  api +
                                  "-" +
                                  revision +
                                  ".json",
                                msg,
                                function(err) {
                                  msg = null;
                                  if (err) {
                                    return console.log(err);
                                  }
                                }
                              );
                              msg = null;
                            }
                          },
                          function() {
                            addCompleted(ms, org, api, revision);
                            deleteFolderRecursive(proxyDir);
                            handleRevision(++revIndex);
                          }
                        );
                      });
                    });
                  }
                }
              },
              function(body, res) {
                //callback on bundle downloaded
                if (body.error) {
                  console.log(body);
                  console.log("timeout bundle download: " + proxyDir);
                  console.log("cleaning up " + proxyDir);

                  fs.writeFile(
                    tempFolder +
                      "/" +
                      org +
                      "-" +
                      api +
                      "-" +
                      revision +
                      "-error.json",
                    body,
                    function(err) {
                      if (err) {
                        return console.log(JSON.stringify(err));
                      }
                    }
                  );
                  console.log("abandonded lint: " + proxyDir);

                  deleteFolderRecursive(proxyDir);
                  handleRevision(++revIndex);
                } else {
                  console.log("completed bundle download: " + proxyDir);
                }
              }
            );
          } else {
            handleAPI(++index);
          }
        }
      }

      ms.get("Revisions", { org }, api, function(body, res) {
        //callback for recisions
        if (body.error) {
          console.log(body);
        } else {
          revisions = JSON.parse(body).revision;
          handleRevision();
        }
      });
    }
  }
  //call back once we have OrgAPIs
  if (res.statusCode == 403 || res.statusCode == 401) {
    throw new Error(res.statusMessage);
  }
  apis = JSON.parse(body);
  handleAPI();
});

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

function getCompletedKey(ms, org, api, revision) {
  return ms.getHost() + "-" + org + "-" + api + "-" + revision;
}
function isCompleted(ms, org, api, revision) {
  var result = completed[getCompletedKey(ms, org, api, revision)];
  return result || false;
}

function addCompleted(ms, org, api, revision) {
  readCompletedFile();
  completed[getCompletedKey(ms, org, api, revision)] = true;
  writeCompletedFile();
}

function writeCompletedFile() {
  fs.writeFile(rootDir + "/completed.json", JSON.stringify(completed), function(
    err
  ) {
    if (err) {
      return console.log(err);
    }
  });
  return completed;
}

function readCompletedFile() {
  try {
    completed = JSON.parse(
      fs.readFileSync(rootDir + "/completed.json", "utf8")
    );
  } catch (e) {
    console.log("initing completed file");
    completed = {};
    writeCompletedFile();
  }
}
