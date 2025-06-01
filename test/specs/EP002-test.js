/*
  Copyright 2019-2025 Google LLC

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

/* global describe, it */

const assert = require("assert"),
  path = require("path"),
  util = require("util"),
  debug = require("debug")("apigeelint:EP002-test"),
  bl = require("../../lib/package/bundleLinter.js");

describe(`EP002 - apiproxy bundle with misplaced elements`, () => {
  let configuration = {
    debug: true,
    source: {
      type: "filesystem",
      path: path.resolve(__dirname, "../fixtures/resources/EP002/apiproxy"),
      bundleType: "apiproxy",
    },
    profile: "apigeex",
    excluded: {},
    setExitCode: false,
    output: () => {}, // suppress output
  };

  /*
   * Tests must not run the linter outside of the scope of an it() ,
   * because then the mocha --grep does not do what you want.
   * This method insures we run the lint once, but only within
   * the scope of it().
   **/
  let items = null,
    ep002Errors;
  const insure = (cb) => {
    if (items == null) {
      bl.lint(configuration, (bundle) => {
        items = bundle.getReport();
        ep002Errors = items.filter(
          (item) =>
            item.messages &&
            item.messages.length &&
            item.messages.find((m) => m.ruleId == "EP002"),
        );
        cb();
      });
    } else {
      cb();
    }
  };

  it("should generate the expected errors", () => {
    insure(() => {
      assert.ok(items);
      assert.ok(items.length);
      assert.equal(ep002Errors.length, 2);
    });
  });

  it("should generate the correct messages for proxy endpoint 1", () => {
    insure(() => {
      let proxyEp1Errors = ep002Errors.filter((item, ix) =>
        item.filePath.endsWith(
          path.normalize("/apiproxy/proxies/proxy-endpoint-1.xml"),
        ),
      );

      assert.ok(proxyEp1Errors);
      assert.equal(proxyEp1Errors.length, 1);
      let expectedErrors = [
        "Extra FaultRules element",
        "Invalid Framjo element",
        "Misplaced DefaultFaultRule element child of Framjo",
        "Misplaced Step element child of PostClientFlow",
        "Invalid Flow element",
      ];
      assert.equal(
        proxyEp1Errors[0].messages.length,
        expectedErrors.length,
        "number of errors",
      );
      proxyEp1Errors[0].messages.forEach((msg) => {
        assert.ok(msg.message);
        assert.ok(expectedErrors.includes(msg.message));
        // disallow repeats
        expectedErrors = expectedErrors.filter((item) => item != msg.message);
      });
      assert.equal(expectedErrors.length, 0);
    });
  });

  it("should generate the correct messages for proxy endpoint 2", () => {
    insure(() => {
      let proxyEp2Errors = ep002Errors.filter((item) =>
        item.filePath.endsWith("/apiproxy/proxies/proxy-endpoint-2.xml"),
      );
      assert.ok(proxyEp2Errors);
      assert.equal(proxyEp2Errors.length, 0);
      // assert.equal(proxyEp2Errors[0].messages.length, expectedErrors.length, "number of errors");
      // proxyEp2Errors[0].messages.forEach( msg => {
      //   assert.ok(msg.message);
      //   assert.ok(expectedErrors.includes(msg.message));
      //   // disallow repeats
      //   expectedErrors = expectedErrors.filter( item => item != msg.message);
      // });
      // assert.equal(expectedErrors.length, 0);
    });
  });

  it("should generate the correct messages for the target endpoint", () => {
    insure(() => {
      let targetErrors = ep002Errors.filter((item) =>
        item.filePath.endsWith(path.normalize("/apiproxy/targets/http-1.xml")),
      );
      assert.ok(targetErrors);
      assert.equal(targetErrors.length, 1);
      // console.log(util.format(targetErrors[0].messages));
      let expectedErrors = [
        "Extra Flows element",
        "Misplaced 'SocketReadTimeoutInSec' element child of Request",
        "Misplaced 'HTTPMonitor' element child of HTTPTargetConnection",
        "Misplaced 'ThisIsBogus' element child of HealthMonitor",
        "Invalid MisPlaced element",
        "LocalTargetConnection element conflicts with HTTPTargetConnection on line 26",
        "Invalid RouteRule element",
        "Misplaced 'ConnectTimeoutInMin' element child of Request",
        "Misplaced 'Status' element child of SuccessResponse",
        "Redundant HealthMonitor element",
        "TCPMonitor element conflicts with HTTPMonitor on line 47",
      ];
      debug(targetErrors[0].messages);
      const ep002Messages = targetErrors[0].messages.filter(
        (m) => m.ruleId == "EP002",
      );
      assert.equal(
        ep002Messages.length,
        expectedErrors.length,
        "number of errors",
      );
      ep002Messages.forEach((msg) => {
        assert.ok(msg.message);
        assert.ok(expectedErrors.includes(msg.message), msg.message);
        // disallow repeats
        expectedErrors = expectedErrors.filter((item) => item != msg.message);
      });
    });
  });

  it("should generate the correct messages for the target endpoint with URL", () => {
    insure(() => {
      let targetErrors = ep002Errors.filter((item) =>
        item.filePath.endsWith("/apiproxy/targets/http-2.xml"),
      );
      assert.ok(targetErrors);
      assert.equal(targetErrors.length, 0);
    });
  });
});

describe(`EP002 - sharedflowbundle with no misplaced elements`, () => {
  let configuration = {
    debug: true,
    source: {
      type: "filesystem",
      path: path.resolve(
        __dirname,
        "../fixtures/resources/ExtractVariables-Attachment/sharedflowbundle",
      ),
      bundleType: "sharedflowbundle",
    },
    profile: "apigeex",
    excluded: {},
    setExitCode: false,
    output: () => {}, // suppress output
  };

  let items = null;
  const insure = (cb) => {
    if (items == null) {
      bl.lint(configuration, (bundle) => {
        items = bundle.getReport();
        cb();
      });
    } else {
      cb();
    }
  };

  it("should generate some errors", () => {
    insure(() => {
      assert.ok(items);
      assert.ok(items.length);
      const itemsWithErrors = items.filter(
        (item) => item.messages && item.messages.length,
      );
      assert.equal(itemsWithErrors.length, 1);
    });
  });

  it("should generate no EP002 errors", () => {
    insure(() => {
      const ep002Errors = items.filter(
        (item) =>
          item.messages &&
          item.messages.length &&
          item.messages.find((m) => m.ruleId == "EP002"),
      );

      assert.equal(ep002Errors.length, 0);
    });
  });
});

describe(`EP002 - EventFlow with no misplaced elements`, () => {
  let configuration = {
    debug: true,
    source: {
      type: "filesystem",
      path: path.resolve(
        __dirname,
        "../fixtures/resources/EP002-eventflow/apiproxy",
      ),
      bundleType: "apiproxy",
    },
    profile: "apigeex",
    excluded: {},
    setExitCode: false,
    output: () => {}, // suppress output
  };

  let items = null;
  const insure = (cb) => {
    if (items == null) {
      bl.lint(configuration, (bundle) => {
        items = bundle.getReport();
        cb();
      });
    } else {
      cb();
    }
  };

  it("should generate some errors", () => {
    insure(() => {
      assert.ok(items);
      assert.ok(items.length);
      const itemsWithErrors = items.filter(
        (item) => item.messages && item.messages.length,
      );
      assert.equal(itemsWithErrors.length, 1);
    });
  });

  it("should generate no EP002 errors", () => {
    insure(() => {
      const ep002Errors = items.filter(
        (item) =>
          item.messages &&
          item.messages.length &&
          item.messages.find((m) => m.ruleId == "EP002"),
      );

      assert.equal(ep002Errors.length, 0);
    });
  });
});
