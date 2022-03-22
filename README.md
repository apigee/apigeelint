# apigeelint

[![Apache 2.0](https://img.shields.io/badge/license-apache%202.0-blue.svg)](LICENSE)
![Node](https://img.shields.io/node/v/apigeelint.svg)
![Test](https://raw.githubusercontent.com/apigee/apigeelint/master/test/badge.svg?sanitize=true)
![LastCommit](https://img.shields.io/github/last-commit/apigee/apigeelint/master.svg)
![CommitActivity](https://img.shields.io/github/commit-activity/4w/apigee/apigeelint)
![Downloads](https://img.shields.io/npm/dm/apigeelint.svg)

Static code analysis for Apigee proxy and sharedflow bundles to encourage API developers to use [best practices](https://cloud.google.com/apigee/docs/api-platform/fundamentals/best-practices-api-proxy-design-and-development) and avoid [anti-patterns](https://cloud.google.com/apigee/docs/api-platform/antipatterns/intro).

This utility is intended to capture the best practices knowledge from across Apigee including our Global Support Center team, Customer Success, Engineering, and our product team in a tool that will help developers create more scalable, performant, and stable API bundles using the Apigee DSL.

## Status

At this point, we are focused on plugin execution and modelling the various lintable assets including Bundles, Proxies, SharedFlows, Targets, Flows, Steps, and Policies.

Plugins that test these abstractions are being developed concurrently.

Reporters (the means to report out results), Ingesters (bundle loaders) are to be developed with Filesystem being the only supported means of loading a bundle and all reporting now going to console.

## Installation

You can install apigeellint using npm. But, there is a minimum version of `npm` required.

1. First verify the version of npm:
   ```
   npm --version
   ```

   If the version is 8.3.0 or later, then proceed to step 2.
   If the version is less than `8.3.0`, then update:
   ```
   npm install npm@8.3.0 -g
   ```

   Alternatively, you may choose to get the latest npm:
   ```
   npm install npm@latest -g
   ```

2. Then install apigeelint:
   ```
   npm install -g apigeelint
   ```

## Usage

Help
```
apigeelint -h
Usage: apigeelint [options]

Options:
  -V, --version                           output the version number
  -s, --path <path>                       Path of the proxies
  -f, --formatter [value]                 Specify formatters (default: json.js)
  -w, --write [value]                     file path to write results
  -e, --excluded [value]                  The comma separated list of tests to exclude (default: none)
  -x, --externalPluginsDirectory [value]  Relative or full path to an external plugins directory
  --list                                  do not execute, instead list the available plugins and formatters
  --maxWarnings [value]                   Number of warnings to trigger nonzero exit code (default: -1)
  --profile [value]                       Either apigee or apigeex (default: apigee)
  -h, --help                              output usage information
```
Example:
```
apigeelint -s sampleProxy/ -f table.js
```

Where `-s` points to the apiProxy source directory and `-f` is the output formatter desired.

Possible formatters are: "json.js" (the default), "stylish.js", "compact.js", "codeframe.js", "html.js", "table.js", "unix.js", "visualstudio.js", "checkstyle.js", "jslint-xml.js", "junit.js" and "tap.js".

Example Using External Plugins:
```
apigeelint -x ./externalPlugins -e PO007 -s test/fixtures/resources/sampleProxy/24Solver/apiproxy -f table.js
```
Where `-x` points to the directory containing externally developed plugins and `-e` excludes the builtin plugin from executing.
This example uses the "externalPlugins" directory with a plugin for alternate policy naming conventions and effectively overrides the built in naming conventions plugin. The output will include the external plugin identifier  `EX-PO007`.

### Listing plugins
List plugins and formatters, with or without --externalPluginsDirectory.
```
apigeelint --list
apigeelint --list -x ./externalPlugins or apigeelint --list --externalPluginsDirectory ./externalPlugins 
 ```

## Does this tool just lint or does it also check style?

This tool does both traditional linting (looking for problematic patterns) and style checking (enforcement of conventions). You can use it for both.

## Tests

The `test` directory includes scripts to exercise a subset of rules. Overall linting can be tested with:

```
apigeelint -s ./test/fixtures/resources/sampleProxy/24Solver/apiproxy/
```
This sample exhibits many bad practices and as such generates some noisy output.

In a development installation, the equivalent to the command above is:
```
node ./cli.js  -s ./test/fixtures/resources/sampleProxy/24Solver/apiproxy/
```

## Contributing

We welcome pull requests for bug fixes and new features.
In lieu of a formal style guide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

Run the unit tests like this:

```
npm run test
```


You can also contribute by reporting issues, asking for new features.

## Rules

The list of rules is a work in progress. We expect it to increase over time. As
product features change (new policies, etc), we will change rules as
well.

This is the current list:

| Linter | Status | Code | Name | Description |
| ------ | ------ | ---- | ---- | ----------- |
| Bundle | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| BN001 | Bundle folder structure correctness.  | Bundles have a clear structure. This plugin ignores some files, like .DS\_store and any file ending in ~. |
| &nbsp; |:white_check_mark:| BN002 | Extraneous files. | Ensure each folder contains appropriate resources in the bundle. |
| &nbsp; |:white_check_mark:| BN003 | Cache Coherence | A bundle that includes cache reads should include cache writes with the same keys. |
| &nbsp; |:white_medium_square:| BN004 | Unused variables. |  Within a bundle variables created should be used in conditions, resource callouts, or policies. |
| &nbsp; |:white_check_mark:| BN005 | Unattached policies. |  Unattached policies are dead code and should be removed from production bundles. |
| &nbsp; |:white_check_mark:| BN006 | Bundle size - policies. |  Large bundles are a symptom of poor design. A high number of policies is predictive of an oversized bundle. |
| &nbsp; |:white_check_mark:| BN007 | Bundle size - resource callouts. |  Large bundles are a symptom of poor design. A high number of resource callouts is indicative of underutilizing out of the box Apigee policies. |
| &nbsp; |:white_medium_square:| BN008 | IgnoreUnresolvedVariables and FaultRules |  Use of IgnoreUnresolvedVariables without the use of FaultRules may lead to unexpected errors. |
| &nbsp; |:white_check_mark:| BN009 | Statistics Collector - duplicate policies |  Warn on duplicate policies when no conditions are present or conditions are duplicates. |
| &nbsp; |:white_check_mark:| BN010 | Missing policies | Issue an error if a referenced policy is not present in the bundle. |
| Proxy Definition | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| PD001 | RouteRules to Targets | RouteRules should map to defined Targets |
| &nbsp; |:white_check_mark:| PD002 | Unreachable Route Rules - defaults |  Only one RouteRule should be present without a condition |
| &nbsp; |:white_check_mark:| PD003 | Unreachable Route Rules |  RouteRule without a condition should be last. |
| &nbsp; |:white_check_mark:| PD004 | ProxyEndpoint name | ProxyEndpoint name should match basename of filename. |
| &nbsp; |:white_check_mark:| PD005 | VirtualHost | ProxyEndpoint should have one HTTPProxyConnection, and in the case of profile=apigeex, no VirtualHost. |
| Target Definition | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| TD001 | Mgmt Server as Target |  Discourage calls to the Management Server from a Proxy via target. |
| &nbsp; |:white_check_mark:| TD002 | Use Target Servers |  Encourage the use of target servers |
| &nbsp; |:white_check_mark:| TD003 | TargetEndpoint name | TargetEndpoint name should match basename of filename. |
| &nbsp; |:white_check_mark:| TD004 | TargetEndpoint SSLInfo | TargetEndpoint HTTPTargetConnection should enable TLS/SSL. |
| &nbsp; |:white_check_mark:| TD005 | TargetEndpoint SSLInfo references | TargetEndpoint SSLInfo should use references for KeyStore and TrustStore. |
| Flow | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| FL001 | Unconditional Flows |  Only one unconditional flow will get executed. Error if more than one was detected. |
| Step | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| ST001 | Empty Step |  Empty steps clutter the bundle. |
| &nbsp; |:white_check_mark:| ST002 | Step Structure | each Step should have at most one Name element, one Condition element, no others. |
| Policy | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| PO001 | JSON Threat Protection |  A check for a body element must be performed before policy execution. |
| &nbsp; |:white_check_mark:| PO002 | XML Threat Protection |  A check for a body element must be performed before policy execution. |
| &nbsp; |:white_check_mark:| PO003 | Extract Variables with JSONPayload |  A check for a body element must be performed before policy execution. |
| &nbsp; |:white_check_mark:| PO004 | Extract Variables with XMLPayload |  A check for a body element must be performed before policy execution. |
| &nbsp; |:white_check_mark:| PO005 | Extract Variables with FormParam |  A check for a body element must be performed before policy execution. |
| &nbsp; |:white_check_mark:| PO006 | Policy Name &amp; filename agreement |  Policy name attribute should coincide with the policy filename. |
| &nbsp; |:white_check_mark:| PO007 | Policy Naming Conventions - type indication |  It is recommended that the policy name use a prefix or follow a pattern that indicates the policy type. |
| &nbsp; |:white_check_mark:| PO008 | Policy DisplayName &amp; DisplayName agreement |  Check that the policy filename matches the display name of the policy. |
| &nbsp; |:white_medium_square:| PO009 | Service Callout Target - Mgmt Server |  Targeting management server may result in higher than expected latency use with caution. |
| &nbsp; |:white_medium_square:| PO010 | Service Callout Target - Target Server |  Encourage use of target servers. |
| &nbsp; |:white_medium_square:| PO011 | Service Callout Target - Dynamic URLs |  Error on dynamic URLs in target server URL tag. |
| &nbsp; |:white_check_mark:| PO012 | AssignMessage/AssignTo | Warn on unnecessary AssignTo in AssignMessage when createNew is false and no destination variable. |
| &nbsp; |:white_check_mark:| PO013 | Resource Call Out - Javascript |  JSHint, ESLint. |
| &nbsp; |:white_medium_square:| PO014 | Resource Call Out - Java |  PMD, Checkstyle. |
| &nbsp; |:white_medium_square:| PO015 | Resource Call Out - Python |  Pylint. |
| &nbsp; |:white_medium_square:| PO016 | Statistics Collector - duplicate variables |  Warn on duplicate variables. |
| &nbsp; |:white_medium_square:| PO017 | Misconfigured - FaultRules/Fault Rule in Policy |  FaultRules are configured in ProxyEndpoints and TargetEndpoints. |
| &nbsp; |:white_check_mark:| PO018 | Regex Lookahead/Lookbehind are Expensive - Threat Protection Policy |  Regular expressions that include lookahead or lookbehind perform slowly on large payloads and are typically not required.|
| &nbsp; |:white_check_mark:| PO019 | Reserved words as variables - ServiceCallout Request |  Using "request" as the name of a Request may cause unexpected side effects.|
| &nbsp; |:white_check_mark:| PO020 | Reserved words as variables - ServiceCallout Response |  Using "response" as the name of a Response may cause unexpected side effects.|
| &nbsp; |:white_medium_square:| PO021 | Statistics Collector - reserved variables |  Warn on insertion of duplicate variables. |
| &nbsp; |:white_check_mark:| PO022 | Nondistributed Quota | When using nondistributed quota the number of allowed calls is influenced by the number of Message Processors (MPs) deployed. This may lead to higher than expected transactions for a given quota as MPs now autoscale. |
| &nbsp; |:white_check_mark:| PO023 | Quota Policy Reuse | When the same Quota policy is used more than once you must ensure that the conditions of execution are mutually exclusive or that you intend for a call to count more than once per message processed. |
| &nbsp; |:white_check_mark:| PO024 | Cache Error Responses | By default the ResponseCache policy will cache non 200 responses. Either create a condition or use policy configuration options to exclude non 200 responses. |
| &nbsp; |:white_check_mark:| PO025 | EsLint Errors | Runs EsLint on all policy resources. |
| &nbsp; |:white_check_mark:| PO026 | AssignVariable Usage | With AssignMessage/AssignVariable, check various usage issues. Example: The Name element must be present. The Ref element, if any, should not be surrounded in curlies. And so on. |
| &nbsp; |:white_check_mark:| PO027 | HMAC Usage | With HMAC, check that the SecretKey is present and that a ref= attribute refers to a private variable. |
| &nbsp; |:white_check_mark:| PO028 | Policy Availability in profile | Check for policies available in particular profiles. |
| &nbsp; |:white_check_mark:| PO029 | Known policy type | Check that all policies are of a known type. |
| &nbsp; |:white_check_mark:| PO030 | ExpirySettings | ExpirySettings should use exactly one child element, no deprecated elements. |
| &nbsp; |:white_check_mark:| PO031 | AssignMessage content-type | When assigning to Payload, you should also assign content-type, exactly once. |
| FaultRules | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| FR001 | No Condition on FaultRule | It's not a best practice to have a FaultRule without an outer condition, which automatically makes the FaultRule true. |
| &nbsp; |:white_check_mark:| FR002 | DefaultFaultRule Structure | DefaultFaultRule should have only supported child elements, at most one AlwaysEnforce element, and at most one Condition element. |
| Conditional | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| CC001 | Literals in Conditionals |  Warn on literals in any conditional statement. |
| &nbsp; |:white_medium_square:| CC002 | Null Blank Checks |  Blank checks should also check for null conditions. (to be reviewed) |
| &nbsp; |:white_check_mark:| CC003 | Long condition statement |  Conditions should not be long. |
| &nbsp; |:white_check_mark:| CC004 | Overly complex condition |  Condition complexity should be limited to fix number of variables and conjunctions. |
| &nbsp; |:white_check_mark:| CC005 | unterminated strings in Condition |  Strings within a Condition element must be properly wrapped by double quotes. |
| &nbsp; |:white_check_mark:| CC006 | Detect logical absurdities |  Conditions should not have internal logic conflicts - warn when these are detected. |
| Endpoints | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| EP001 | CORS Policy attachment | Check for multiple CORS policies, or attachment to Target Endpoint. |
| Deprecation | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| DC001 | ConcurrentRateLimit Policy Deprecation |  Check usage of deprecated policy ConcurrentRateLimit. |
| &nbsp; |:white_check_mark:| DC002 | OAuth V1 Policies Deprecation |  Check usage of deprecated OAuth V1 policies. |

From an implementation perspective, the focus is on plugin support and flexibility over performance. Compute is cheap.


## Support

If you find issues, file a ticket here on Github.  Keep in mind that there is no
service level agreement (SLA) for responses to these issues. Assume all
responses are on an ad-hoc, volunteer basis.

If you simply have questions, we recommend asking on the [Apigee
forum](https://www.googlecloudcommunity.com/gc/Apigee/bd-p/cloud-apigee/) on
GoogleCloudCommunity. Apigee experts regularly check that forum.
checked by Apigee experts.

Apigee customers should use [formal support channels](https://cloud.google.com/apigee/support) for Apigee product related concerns.



## License and Copyright

This material is [Copyright (c) 2018-2022 Google LLC](./NOTICE).
and is licensed under the [Apache 2.0 License](LICENSE).

## Disclaimer

This tool is open-source software. It is not an officially supported Google
product. It is not a part of Apigee, or any other officially supported Google
Product.
