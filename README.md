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

## Rules

The list of rules is a work in progress and expected to increase over time. As product features change, rules will change as well. Linting and reporting will fall into one of the following broad categories:

| Linter | Status | Code | Name | Description |
| ------ | ------ | ---- | ---- | ----------- |
| Bundle | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |-[ ] | BN001 | Bundle folder structure correctness. | Bundles have a clear structure. |
| &nbsp; |-[ ] | BN002 | Extraneous files. | Ensure each folder contains approrpriate resources in the bundle. |
| &nbsp; |-[ ] | BN003 | Cache Coherence | A bundle that includes cache reads should include cache writes with the same keys. |
| &nbsp; |-[ ] | BN004 | Unused variables. |  Within a bundle variables created should be used in conditions, resource callouts, or policies. |
| &nbsp; |-[x] | BN005 | Unattached policies. |  Unattached policies are dead code and should be removed from production bundles. |
| &nbsp; |-[x] | BN006 | Bundle size - policies. |  Large bundles are a symptom of poor design. A high number of policies is predictive of an oversized bundle. |
| &nbsp; |-[ ] | BN007 | Bundle size - resource callouts. |  Large bundles are a symptom of poor design. A high number of resource callouts is indicative of underutilizing out of the box Apigee policies. |
| &nbsp; |-[ ] | BN008 | IgnoreUnresolvedVariables and FaultRules |  Use of IgnoreUnresolvedVariables without the use of FaultRules may lead to unexepected errors. |
| &nbsp; |-[ ] | BN009 | Statistics Collector - duplicate policies |  Warn on duplicate policies when no conditions are present or conditions are duplicates. |
| Proxy Definition | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |-[ ] | PD001 | RouteRules to Targets |  RouteRules should map to defined Targets. |
| &nbsp; |-[ ] | PD002 | Unreachable Route Rules - defaults |  Only one RouteRule should be present without a condition |
| &nbsp; |-[ ] | PD003 | Unreachable Route Rules |  RouteRule without a condition should be last. |
| &nbsp; |-[ ] | PD004 | Condition Complexity |  Ovelry complext Condition statements make RouteRules difficult to debug and maintain |
| Target Definition | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |-[ ] | TD001 | Mgmt Server as Target |  Discourage calls to the Management Server from a Proxy. |
| &nbsp; |-[ ] | TD002 | Use Target Servers |  Encourage the use of target servers |
| Flow | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |-[ ] | FL001 | Unconditional Flows |  Only one unconditional flow will get executed. Error if more than one was detected. |
| Step | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |-[x] | ST001 | Empty Step |  Empty steps clutter the bundle. |
| Policy | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |-[ ] | PO001 | JSON Threat Protection |  A check for a body element must be performed before policy execution. |
| &nbsp; |-[ ] | PO002 | XML Threat Protection |  A check for a body element must be performed before policy execution. |
| &nbsp; |-[ ] | PO003 | Extract Variables with JSONPayload |  A check for a body element must be performed before policy execution. |
| &nbsp; |-[ ] | PO004 | Extract Variables with XMLPayload |  A check for a body element must be performed before policy execution. |
| &nbsp; |-[ ] | PO005 | Extract Variables with FormParam |  A check for a body element must be performed before policy execution. |
| &nbsp; |-[ ] | PO006 | Policy Naming Conventions - default name |  Policy names should not be default. |
| &nbsp; |-[ ] | PO007 | Policy Naming Conventions - type indication |  It is recommended that the policy name include an indicator of the policy type. |
| &nbsp; |-[ ] | PO008 | Policy Name Attribute Conventions |  It is recommended that the policy name attribute match the display name of the policy. |
| &nbsp; |-[ ] | PO009 | Service Callout Target - Mgmt Server |  Targetting management server may result in higher than expected latency use with caution. |
| &nbsp; |-[ ] | PO010 | Service Callout Target - Target Server |  Encourage use of target servers. |
| &nbsp; |-[ ] | PO011 | Service Callout Target - Dynamic URLs |  Error on dynamic URLs in target server URL tag. |
| &nbsp; |-[ ] | PO012 | Service Callout Target - Script Target Node |  JSHint, ESLint. |
| &nbsp; |-[ ] | PO013 | Resoure Call Out - Javascript |  JSHint, ESLint. |
| &nbsp; |-[ ] | PO014 | Resoure Call Out - Java |  PMD, Checkstyle. |
| &nbsp; |-[ ] | PO016 | Resoure Call Out - Python |  Pylint. |
| &nbsp; |-[ ] | PO016 | Statistics Collector - duplicate variables |  Warn on duplicate variables. |
| &nbsp; |-[ ] | PO016 | Statistics Collector - reserved variables |  Warn on insertion of duplicate variables. |
| &nbsp; |-[ ] | PO017 | Misconfigured - FaultRules/Fault Rule in Policy |  FaultRules are configured in ProxyEndpoints and TargetEndpoints. |
| Conditional | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |-[ ] | CC001 | Literals in Conditionals |  Warn on literals in any conditional statement. |
| &nbsp; |-[ ] | CC002 | Null Blank Checks |  Blank checks should also check for null conditions. (to be reviewed) |
| &nbsp; |-[x] | CC003 | Long condition statement |  Conditions should not be long. |
| &nbsp; |-[ ] | CC004 | Overly complex condition |  Condition complexity should be limited to fix number of variables and conjunctions. |


From an implementation perspective the focus is on plugin support and flexibility over performance. Compute is cheap. 