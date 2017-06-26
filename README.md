# bundle-linter

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/260964318a4e4e689cbd6d059472765e)](https://www.codacy.com/app/davidwallen/bundle-linter?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=apigeecs/bundle-linter&amp;utm_campaign=Badge_Grade)

Static code analysis for Apigee proxy bundles to encourage API developers to use best practices and avoid anti-patterns.

This utility is intended to capture the best practices knowledge from across Apigee including our Global Support Center team, Customer Success, Engineering, and our product team in a tool that will help developers create more scalable, performant, and stable API bundles using the Apigee DSL.

## Status

At this point we are focused on plugin execution and modelling the various lintable assets including Bundles, Proxies, Targets, Flows, Steps, and Policies.

Plugins that test these abstractions are being developed concurrently.

Reporters (the means to report out results), Ingesters (bundle loaders) are to be developed with Filesystem being the only supported means of loading a bundle and all reporting now going to console.

## Usage

apigeelint -s sampleProxy/

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Rules

The list of rules is a work in progress and expected to increase over time. As product features change, rules will change as well. Linting and reporting will fall into one of the following broad categories:

| Linter | Status | Code | Name | Description |
| ------ | ------ | ---- | ---- | ----------- |
| Bundle | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_medium_square:| BN001 | Bundle folder structure correctness. | Bundles have a clear structure. |
| &nbsp; |:white_medium_square:| BN002 | Extraneous files. | Ensure each folder contains approrpriate resources in the bundle. |
| &nbsp; |:white_medium_square:| BN003 | Cache Coherence | A bundle that includes cache reads should include cache writes with the same keys. |
| &nbsp; |:white_medium_square:| BN004 | Unused variables. |  Within a bundle variables created should be used in conditions, resource callouts, or policies. |
| &nbsp; |:white_check_mark:| BN005 | Unattached policies. |  Unattached policies are dead code and should be removed from production bundles. |
| &nbsp; |:white_check_mark:| BN006 | Bundle size - policies. |  Large bundles are a symptom of poor design. A high number of policies is predictive of an oversized bundle. |
| &nbsp; |:white_medium_square:| BN007 | Bundle size - resource callouts. |  Large bundles are a symptom of poor design. A high number of resource callouts is indicative of underutilizing out of the box Apigee policies. |
| &nbsp; |:white_medium_square:| BN008 | IgnoreUnresolvedVariables and FaultRules |  Use of IgnoreUnresolvedVariables without the use of FaultRules may lead to unexepected errors. |
| &nbsp; |:white_medium_square:| BN009 | Statistics Collector - duplicate policies |  Warn on duplicate policies when no conditions are present or conditions are duplicates. |
| Proxy Definition | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_medium_square:| PD001 | RouteRules to Targets |  RouteRules should map to defined Targets. |
| &nbsp; |:white_check_mark:| PD002 | Unreachable Route Rules - defaults |  Only one RouteRule should be present without a condition |
| &nbsp; |:white_check_mark:| PD003 | Unreachable Route Rules |  RouteRule without a condition should be last. |
| &nbsp; |:white_medium_square:| PD004 | Condition Complexity |  Overly complext Condition statements make RouteRules difficult to debug and maintain |
| Target Definition | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_medium_square:| TD001 | Mgmt Server as Target |  Discourage calls to the Management Server from a Proxy. |
| &nbsp; |:white_medium_square:| TD002 | Use Target Servers |  Encourage the use of target servers |
| Flow | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| FL001 | Unconditional Flows |  Only one unconditional flow will get executed. Error if more than one was detected. |
| Step | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| ST001 | Empty Step |  Empty steps clutter the bundle. |
| Policy | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_medium_square:| PO001 | JSON Threat Protection |  A check for a body element must be performed before policy execution. |
| &nbsp; |:white_medium_square:| PO002 | XML Threat Protection |  A check for a body element must be performed before policy execution. |
| &nbsp; |:white_medium_square:| PO003 | Extract Variables with JSONPayload |  A check for a body element must be performed before policy execution. |
| &nbsp; |:white_medium_square:| PO004 | Extract Variables with XMLPayload |  A check for a body element must be performed before policy execution. |
| &nbsp; |:white_medium_square:| PO005 | Extract Variables with FormParam |  A check for a body element must be performed before policy execution. |
| &nbsp; |:white_medium_square:| PO006 | Policy Naming Conventions - default name |  Policy names should not be default. |
| &nbsp; |:white_medium_square:| PO007 | Policy Naming Conventions - type indication |  It is recommended that the policy name include an indicator of the policy type. |
| &nbsp; |:white_medium_square:| PO008 | Policy Name Attribute Conventions |  It is recommended that the policy name attribute match the display name of the policy. |
| &nbsp; |:white_medium_square:| PO009 | Service Callout Target - Mgmt Server |  Targetting management server may result in higher than expected latency use with caution. |
| &nbsp; |:white_medium_square:| PO010 | Service Callout Target - Target Server |  Encourage use of target servers. |
| &nbsp; |:white_medium_square:| PO011 | Service Callout Target - Dynamic URLs |  Error on dynamic URLs in target server URL tag. |
| &nbsp; |:white_medium_square:| PO012 | Service Callout Target - Script Target Node |  JSHint, ESLint. |
| &nbsp; |:white_check_mark:| PO013 | Resoure Call Out - Javascript |  JSHint, ESLint. |
| &nbsp; |:white_medium_square:| PO014 | Resoure Call Out - Java |  PMD, Checkstyle. |
| &nbsp; |:white_medium_square:| PO016 | Resoure Call Out - Python |  Pylint. |
| &nbsp; |:white_medium_square:| PO016 | Statistics Collector - duplicate variables |  Warn on duplicate variables. |
| &nbsp; |:white_medium_square:| PO016 | Statistics Collector - reserved variables |  Warn on insertion of duplicate variables. |
| &nbsp; |:white_medium_square:| PO017 | Misconfigured - FaultRules/Fault Rule in Policy |  FaultRules are configured in ProxyEndpoints and TargetEndpoints. |
| &nbsp; |:white_medium_square:| PO018 | Regex Lookahead/Lookbehind are Expensive - Threat Protection Policy |  Regular expressions that include lookahead or lookbehind perform slowly on large payloads and are typically not required.|
| &nbsp; |:white_check_mark:| PO019 | Reserved words as variables - ServiceCallout Request |  Using "request" as the name of a Request may cause unexpected side effects.|
| &nbsp; |:white_check_mark:| PO020 | Reserved words as variables - ServiceCallout Response |  Using "response" as the name of a Response may cause unexpected side effects.|
| Conditional | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_medium_square:| CC001 | Literals in Conditionals |  Warn on literals in any conditional statement. |
| &nbsp; |:white_medium_square:| CC002 | Null Blank Checks |  Blank checks should also check for null conditions. (to be reviewed) |
| &nbsp; |:white_check_mark:| CC003 | Long condition statement |  Conditions should not be long. |
| &nbsp; |:white_medium_square:| CC004 | Overly complex condition |  Condition complexity should be limited to fix number of variables and conjunctions. |
| &nbsp; |:white_medium_square:| CC005 | Regex Lookahead/Lookbehind are Expensive - Conditions |  Regular expressions that include lookahead or lookbehind perform slowly on large payloads and are typically not required.|
| &nbsp; |:white_check_mark:| CC006 | Detect logical absurdities |  Conditions should not have internal logic conflicts - warn when these are detected. |


From an implementation perspective the focus is on plugin support and flexibility over performance. Compute is cheap.
