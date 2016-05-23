# bundle-linter

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/e1d2b19961914f41bc3711fce42df155)](https://www.codacy.com?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=apigeecs/bundle-linter&amp;utm_campaign=Badge_Grade)

Static code analysis for Apigee proxy bundles to encourage API developers to use best practices and avoid anti-patterns.

## Status

At this point we are focused on plugin execution and modelling the various lintable assets including Bundles, Proxies, Targets, Flows, Steps, and Policies.

Plugins that test these abstractions are being developed concurrently.

Reporters (the means to report out results), Ingesters (bundle loaders) are to be developed with Filesystem being the only supported means of loading a bundle and all reporting now going to console.

## Usage

A simple script based approach is used right now. The sample.js configuration at root executes a linting session against the default bundle:

var bl = require("./package/bundleLinter.js");

	var configuration = {
	    debug: true,
	    "source": {
	        "type":"filesystem",
	        "path": "../sampleProxy",
	    }
	};

	bl.lint(configuration);


## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Scope

Linting and reporting will fall into one of the following broad categories:

 1. Bundle
  * Bundle folder structure correctness.
  * Cache coherence: does the bundle include cache read and cache writes within the flow? If not then warn the API developer that relying on external cache population may not result in expected behavior. If data is configuration style data use KVM instead.
  * Unused variables: variables created in Extract Variables are not subsequently used in AssignMessage, AssignMessage, Conditionals, Resource Callouts, or else where.
  * Unattached Policies
  * Bundle size - check for number of policies, number of proxy definitions, size of bundle, etc.
  * Bundles containing policies using variables without IgnoreUnresolvedVariables and without fault rules always leads to nasty errors. Bundle scan to check for occurence.
  * non XML files in the policies directory
 2. Proxy Definition(s)
  * RouteRules that map to Targets - identify if a RouteRule point to a target that exists.
  * RouteRules without conditions check - only one and last - check for unreachable route rules.
 3. Target Definition(s)
  * Encourage use of target servers rather than hardcoded targets.
  * Warn if Mgmt Server is a target.
 4. Flow(s)
  * Warn if unconditional flow is defined more than once, defined other than last - unreachable flow error.
 6. Conditionals
  * Conditionals that check “” or Null - is there a preferred approach - would we warn against one way or the other on this - should the developer always redundantly check?
  * JSON Threat protection policy should have a condition check for a body.
  * XML Threat protection policy should have a condition check for a body.
  * ExtractVariable accessing body without a conditional that guards against requests without a body.
 5. Policies
  * Policy file naming convention check
  * Policy name attribute naming convention check
  * Policy file name and name attribute consistency check
  * Policy name attribute and display name attribute consistency check
  * Service Callouts that target Mgmt Server - warn.
  * JSHint/ESLint to all Javascript Resource Callouts
  * PMD and Checkstyle for all Java Resource Callouts
  * Pylint for Python Resource Callouts
  * Correct implementation of dynamic urls in service callouts.
 6. AX
  * Redundant variables in AX - compare what we add to what exists already or is included by default. Review by name and by resoltuion of the upstream variable assignment.
 7. Deployment meta data
  * POM file linting TBD
  * config.json analysis TBD

From an implementation perspective the focus is on plugin support and flexibility over performance. Compute is cheap. 