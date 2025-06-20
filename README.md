# apigeelint

[![Apache 2.0](https://img.shields.io/badge/license-apache%202.0-blue.svg)](LICENSE)
![Node](https://img.shields.io/node/v/apigeelint.svg)
![Test](https://raw.githubusercontent.com/apigee/apigeelint/main/test/badge.svg?sanitize=true)
![LastCommit](https://img.shields.io/github/last-commit/apigee/apigeelint/main.svg)
![CommitActivity](https://img.shields.io/github/commit-activity/4w/apigee/apigeelint)
![Downloads](https://img.shields.io/npm/dm/apigeelint.svg)
[![Node.js Package](https://github.com/apigee/apigeelint/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/apigee/apigeelint/actions/workflows/npm-publish.yml)

Static code analysis for Apigee proxy and sharedflow bundles to encourage API developers to use [best practices](https://cloud.google.com/apigee/docs/api-platform/fundamentals/best-practices-api-proxy-design-and-development) and avoid [anti-patterns](https://cloud.google.com/apigee/docs/api-platform/antipatterns/intro).

This utility is intended to capture the best practices knowledge from across Apigee including our Global Support Center team, Customer Success, Engineering, and our product team in a tool that will help developers create more scalable, performant, and stable API bundles using the Apigee DSL.

## Status

This tool is mature and stable, works with proxy and sharedflow bundles, and
continues to get enhancements.  There are a variety of plugins that test
Bundles, Policies, ProxyEndpoints, and more.

The tool can report results out to the console, or to a file.  The tool can
ingest from a directory containing the proxy bundle, or from a zipped bundle.

## Installation

You can install apigeellint using npm. But, there is a minimum version of `npm` required.

1. First verify the version of node and npm:
   ```
   npm --version
   node --version
   ```

   If the npm version is 10.5.0 or later, and node version is 20 or later, then proceed to step 2.
   Otherwise, you need to update npm and/or node.

2. Then install apigeelint:
   ```
   npm install -g apigeelint
   ```

## Basic Usage

Help

```sh
apigeelint -h
Usage: apigeelint [options]

Options:
  -V, --version                           output the version number
  -s, --path <path>                       Path of the proxy or sharedflow to analyze (directory or zipped bundle)
  -d, --download [value]                  Download the API proxy or sharedflow to analyze. Exclusive of -s / --path. Example: org:ORG,api:PROXYNAME or org:ORG,sf:SHAREDFLOWNAME
  -f, --formatter [value]                 Specify formatters (default: json.js)
  -w, --write [value]                     file path to write results
  -e, --excluded [value]                  The comma separated list of tests to exclude (default: none)
  -x, --externalPluginsDirectory [value]  Relative or full path to an external plugins directory
  -q, --quiet                             do not emit the report to stdout. (can use --write option to write to file)
  --list                                  do not execute, instead list the available plugins and formatters
  --maxWarnings [value]                   Number of warnings to trigger nonzero exit code (default: -1)
  --profile [value]                       Either apigee or apigeex (default: apigee)
  --norc                                  do not search for and use the .apigeelintrc file for settings
  --ignoreDirectives                      ignore any directives within XML files that disable warnings
  -h, --help                              output usage information
```

Example:
```sh
apigeelint -s sampleProxy/apiproxy -f table.js
```

Where `-s` points to the apiProxy source directory or bundled zip file, and `-f` is the output
formatter desired.

Possible formatters are: "json.js" (the default), "stylish.js", "compact.js", "codeframe.js", "codeclimate.js", "html.js", "table.js", "unix.js", "visualstudio.js", "checkstyle.js", "jslint-xml.js", "junit.js" and "tap.js".

## Examples

### Basic usage: ingest from a directory
```sh
apigeelint -f table.js -s path/to/your/apiproxy
```

The path here should be a directory name, probably ending in "apiproxy".  The
contents of that directory should be like this:

```
apiproxy/
apiproxy/proxies/
apiproxy/proxies/endpoint1.xml
apiproxy/servicecallout-async-test.xml
apiproxy/resources/
apiproxy/resources/jsc/
apiproxy/resources/jsc/...
apiproxy/policies/
apiproxy/policies/RF-Unknown-Request.xml
apiproxy/policies/AM-Response.xml
apiproxy/policies/...
...
```


### Basic usage: ingest from a zipped proxy bundle

You can export API Proxy or Sharedflow bundles from Apigee, producing a zip
archive. This tool also can read and analyze these zipped bundles:

```
apigeelint -f table.js -s path/to/your/apiproxy.zip
```

The tool will unzip the bundle into a temporary directory, perform the analysis,
and then remove the temporary directory.


### Basic usage: downloading a proxy bundle to analyze

You can ask apigeelint to export an API Proxy or Sharedflow bundle from Apigee,
and analyze the resulting zip archive. This connects to apigee.googleapis.com to
perform the export, which means it will work only with Apigee X or hybrid.

```
# to download and then analyze a proxy bundle
apigeelint -f table.js -d org:ORG-NAME,api:name-of-your-api-proxy

# to download and then analyze a sharedflow bundle
apigeelint -f table.js -d org:ORG-NAME,sf:name-of-your-shared-flow
```

With this invocation, the tool will:
- obtain a token using the `gcloud auth print-access-token` command
- use the token to inquire the latest revision of the proxy or sharedflow
- use the token to download the bundle for the latest revision
- unzip the bundle into a temporary directory
- perform the lint analysis
- render the result
- and then remove the temporary directory

If you do not have the [`gcloud` command line
tool](https://cloud.google.com/sdk/gcloud) installed, and available on your
path, this will fail.


#### Variations

1. To tell apigeelint to skip invocation of `gcloud`, specify a token you have obtained previously:
   ```sh
   apigeelint -f table.js -d org:ORG-NAME,api:NAME-OF-APIPROXY,token:ACCESS_TOKEN_HERE
   ```

   In this case, apigeelint does not try to use `gcloud` to obtain an access token.

2. To tell apigeelint to download a particular revision to scan, specify the `rev:` segment:
   ```sh
   apigeelint -f table.js -d org:ORG-NAME,api:NAME-OF-APIPROXY,rev:4
   ```

3. To combine the prior two examples, specify a token and a revision:
   ```sh
   apigeelint -f table.js -d org:ORG-NAME,api:NAME-OF-APIPROXY,rev:4,token:ACCESS_TOKEN_HERE
   ```

4. To tell apigeelint to get a token via gcloud, then download the latest
   revision that is deployed in a particular environment, specify the `env:`
   segment:

   ```sh
   apigeelint -f table.js -d org:ORG-NAME,api:NAME-OF-APIPROXY,env:stg
   ```



### Using External Plugins

We package apigeelint with a broad set of plugins that we think
will be generally valuable. For people that want to check for some
case that is not covered by the bundled plugins, you can write your own plugin.
Just follow the pattern as exhibited by the many plugins that are available.
External Plugins must use a name that conforms to this pattern:
- a prefix of "EX".
- followed by a dash
- followed by two uppercase alphabetic characters
- followed by three decimal digits.

Example:  EX-PO007


You could, for example, create your own plugin for naming conventions, and
exclude the builtin plugin that enforces naming conventions (`PO007`) with the
`-e` option:

To use external plugins, specify the directory that contains them, on the
command line. For example, this invocation might use your own plugin,
and disable the built-in naming conventions that apigeelint checks:

```
apigeelint -x ./externalPlugins -e PO007 -s path/to/your/apiproxy -f table.js
```

In the above, `-x` points to the directory containing externally developed plugins.



### Excluding plugins

You can, of course, exclude plugins without providing a replacement implementation:

```
apigeelint -s path/to/your/apiproxy -f table.js -e PO007,ST003
```

The above would exclude the policy naming convention check (`PO007`), and would
also not check for conditions on an ExtractVariables with a JSONPayload
(`ST003`), if for some reason you wanted to do that.


### Writing output to a file
```
apigeelint -s sampleProxy/apiproxy -f table.js -w existing-outputdir --quiet
```

The `-w` option can point to an existing directory, in which case the output
will be emitted to a file named apigeelint.out in that directory, in whatever
format you specify with `-f`. An existing file by that name will be overwritten. If the
`-w` option is not a directory, it is treated as the name of a file, and output
is written there.

If you do not also specify `--quiet` the report will go to both stdout and to
the specified filesystem destination.

### Selecting a profile

Apigee X/hybrid is very similar to Apigee Edge, but there are differences in the
supported policy types, and some of the supported configuration options. For
example, policies like GraphQL, the AssertCondition, or the Integration policy
step types are available only in X/hybrid.

As a result of these differences, a proxy that is valid in Apigee Edge might not
work in Apigee X, and vice versa.  Apigeelint uses the `--profile` option to
allow the user to configure which target environment is intended: Edge
(`--profile apigee`) or X/hybrid (`--profile apigeex`). The default is `apigee`.

```sh
# lint a proxy that will be used in Apigee X/hybrid
apigeelint -f table.js --profile apigeex -s path/to/your/apiproxy

# lint a proxy that will be used in Apigee Edge
apigeelint -f table.js --profile apigee -s path/to/your/apiproxy
```

As an example, if you lint a proxy that uses the GraphQL policy type, and you
specify the `apigee` profile, the PO028 plugin will issue an error, telling you
that the GraphQL policy is not available in the apigee profile.  If you lint the
same proxy with the `apigeex` profile, apigeelint will not generate an error.

The selection of a profile affects other checks, too. For example, [the Google
Authentication feature](https://cloud.google.com/apigee/docs/api-platform/security/google-auth/overview)
is available only in X/hybrid.

### Using the .apigeelintrc file

Starting with release v2.53.0, apigeelint will look for an .apigeelintrc file, with
settings that you want apigeelint to always use, unless overridden on the
command line. If you want to avoid this, use the `--norc` option.


If you DO want apigeelint to use an `.apigeelintrc` file, format the file like this:

```
# settings for apigeelint
# Comment lines begin with octothorpe.

## specify a profile
--profile apigeex

## always exclude these plugins
--excluded TD002,TD007

## use this formatter unless overridden
--formatter table.js

```

Each non-blank line should have a single "option" as supported by the command-line interface.

apigeelint will look for an .apigeelintrc file in these locations, in order of precedence:
* the parent directory of the apiproxy or sharedflowbundle directory specified in the "path" argument
* the current working directory where apigeelint is running
* the "home" directory for the current user

apigeelint stops looking for an rc file as soon as it finds one. apigeelint does
not combine rc files from these locations.

These command-line options have no effect when they appear in the rc file:
* --path
* --list
* --version
* --help
* --norc

### Disabling rules within specific files

Starting with release v2.55.5, apigeelint allows you to disable rules for
specific locations in XML files, using a specially formatted comment. The
comment should be like so:

```xml
   <!-- apigeelint disable=RULEID[,RULEID...] -->
```

The comment should appear on the line before the line indicated in the error or
warning message. If the error or warning you wish to disable does not specify a
line number, the comment should appear on the first line beneath the root
element.

Example:

```
<TargetEndpoint name="target-1">
  <!-- apigeelint disable=TD004 -->
  <HTTPTargetConnection>
    <Authentication>
      <GoogleIDToken>
        <Audience>https://audience2.run.app</Audience>
      </GoogleIDToken>
    </Authentication>
    <!-- apigeelint disable=TD007 -->
    <SSLInfo>
      <Enabled>true</Enabled>
      <IgnoreValidationErrors>false</IgnoreValidationErrors>
    </SSLInfo>
    <Properties/>
    <!-- apigeelint disable=TD002 -->
    <URL>https://my-target-server.altostrat.com</URL>
  </HTTPTargetConnection>
</TargetEndpoint>
```

You can tell apigeelint to ignore these directives with the command-line otion `--ignoreDirectives`.

## Pipeline lint job integration

### GitLab CI/CD

On GitLab CI/CD, on your `.gitlab-ci.yml` you can use codequality report artifact to get
a report supported by GitLab. Once the CI/CD has been completed, a new tab appears in your
Pipeline named "[Code Quality](https://docs.gitlab.com/ee/ci/testing/code_quality.html)".
This new tab lets you easily view the information from the apigeelint job, with the associated
severity level and lines affected. A widget with the same information appears during merge requests.

```yml
apigeelint:
  stage: lint
  image: node:12-alpine
  before_script:
    - npm install -g apigeelint
  script:
    - apigeelint -f codeclimate.js > apigeelint-results.json
  artifacts:
    reports:
      codequality:
        - "${CI_PROJECT_DIR}/apigeelint-results.json"
```

## Does this tool just lint or does it also check style?

This tool does both traditional linting (looking for problematic patterns) and
style checking (enforcement of conventions). You can use it for both.

## Tests to validate the installation

The `test` directory includes scripts to exercise a subset of rules. Overall linting can be tested with:

```
apigeelint -s ./test/fixtures/resources/sampleProxy/24Solver/apiproxy/
```
This sample exhibits many bad practices and as such generates numerous errors and warnings in output.

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

or, run the tests just for one plugin, like this:

```
./node_modules/mocha/bin/mocha --grep "^PO033"
```

You can also contribute by reporting issues, or requesting new features.

## Rules

The list of rules is a work in progress. We expect it to increase over time. As
product features change (new policies, deprecated policies, etc), we will change rules as
well.

This is the current list:

| Linter | Status | Code | Name | Description |
| ------ | ------ | ---- | ---- | ----------- |
| Bundle | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| BN001 | Bundle folder structure correctness.  | Bundles have a clear structure. This plugin ignores some files, like .DS\_store and any file ending in ~. |
| &nbsp; |:white_medium_square:| BN002 | Extraneous files. | Ensure each folder contains appropriate resources in the bundle. |
| &nbsp; |:white_check_mark:| BN003 | Cache Coherence | A bundle that includes cache reads should include cache writes with the same keys. |
| &nbsp; |:white_medium_square:| BN004 | Unused variables. |  Within a bundle variables created should be used in conditions, resource callouts, or policies. |
| &nbsp; |:white_check_mark:| BN005 | Unattached policies. |  Unattached policies are dead code and should be removed from production bundles. |
| &nbsp; |:white_check_mark:| BN006 | Bundle size - policies. |  Large bundles are a symptom of poor design. A high number of policies is predictive of an oversized bundle. |
| &nbsp; |:white_check_mark:| BN007 | Bundle size - resource callouts. |  Large bundles are a symptom of poor design. A high number of resource callouts is indicative of underutilizing out of the box Apigee policies. |
| &nbsp; |:white_medium_square:| BN008 | IgnoreUnresolvedVariables and FaultRules |  Use of IgnoreUnresolvedVariables without the use of FaultRules may lead to unexpected errors. |
| &nbsp; |:white_check_mark:| BN009 | Statistics Collector - duplicate policies |  Warn on duplicate policies when no conditions are present or conditions are duplicates. |
| &nbsp; |:white_check_mark:| BN010 | Missing policies | Issue an error if a referenced policy is not present in the bundle. |
| &nbsp; |:white_check_mark:| BN011 | Check each XML file for well-formedness.|
| &nbsp; |:white_check_mark:| BN012 | unreferrenced Target Endpoints | Check that each TargetEndpoint can be reached. |
| &nbsp; |:white_check_mark:| BN013 | Unreferenced resources. | Warn for resources that not referenced in any policy. Unreferenced resources are dead code. |
| &nbsp; |:white_check_mark:| BN014 | Duplicate policies. | Warn if there are identically configured, if differently named, policies. |
| Proxy Definition | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| PD001 | RouteRules to Targets | RouteRules should map to defined Targets. |
| &nbsp; |:white_check_mark:| PD002 | Unreachable Route Rules - defaults |  Only one RouteRule should be present without a condition. |
| &nbsp; |:white_check_mark:| PD003 | Unreachable Route Rules |  RouteRule without a condition should be last. |
| &nbsp; |:white_check_mark:| PD004 | ProxyEndpoint name | ProxyEndpoint name should match basename of filename. |
| &nbsp; |:white_check_mark:| PD005 | VirtualHost | ProxyEndpoint should have one HTTPProxyConnection, and in the case of profile=apigeex, no VirtualHost. |
| &nbsp; |:white_check_mark:| PD006 | ProxyEndpoint BasePath | ProxyEndpoint HTTPProxyConnection should have one BasePath. |
| Target Definition | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| TD001 | Mgmt Server as Target |  Discourage calls to the Management Server from a Proxy via target. |
| &nbsp; |:white_check_mark:| TD002 | Use Target Servers |  Encourage the use of target servers. |
| &nbsp; |:white_check_mark:| TD003 | TargetEndpoint name | TargetEndpoint name should match basename of filename. |
| &nbsp; |:white_check_mark:| TD004 | TargetEndpoint SSLInfo | TargetEndpoint HTTPTargetConnection use Enable in SSLInfo. On ApigeeX should also use Enforce. |
| &nbsp; |:white_check_mark:| TD005 | TargetEndpoint SSLInfo references | TargetEndpoint SSLInfo should use references for KeyStore and TrustStore. |
| &nbsp; |:white_check_mark:| TD006 | TargetEndpoint SSLInfo | When using a LoadBalancer, configure SSLInfo in the TargetServer, even if SSLInfo is also present under HTTPTargetConnection. |
| &nbsp; |:white_check_mark:| TD007 | TargetEndpoint SSLInfo | TargetEndpoint HTTPTargetConnection SSLInfo should use TrustStore. |
| &nbsp; |:white_check_mark:| TD008 | TargetEndpoint LoadBalancer Servers | LoadBalancer should not have multiple IsFallback Server entries. |
| &nbsp; |:white_check_mark:| TD009 | TargetEndpoint LoadBalancer | TargetEndpoint HTTPTargetConnection should have at most one LoadBalancer. |
| &nbsp; |:white_check_mark:| TD010 | TargetEndpoint LoadBalancer Servers | LoadBalancer should have at least one Server entry, and no duplicate Server entries. |
| &nbsp; |:white_check_mark:| TD011 | TargetEndpoint SSLInfo | TargetEndpoint HTTPTargetConnection SSLInfo should not Ignore validation errors. |
| &nbsp; |:white_check_mark:| TD012 | TargetEndpoint SSLInfo | Will flag missing SSLInfo in TargetEndpoint HTTPTargetConnection when using URL; will flag multiple SSLInfo when using LoadBalancer. |
| &nbsp; |:white_check_mark:| TD013 | TargetEndpoint SSLInfo | TargetEndpoint HTTPTargetConnection should correctly configure ClientAuthEnbled. |
| &nbsp; |:white_check_mark:| TD014 | TargetEndpoint SSLInfo | TargetEndpoint HTTPTargetConnection should use exctly one of URL, LoadBalancer. |
| &nbsp; |:white_check_mark:| TD015 | TargetEndpoint LoadBalancer | If TargetEndpoint HTTPTargetConnection uses a LoadBalancer with more than one Server, it should specify a non-zero MaxFailures. |
| &nbsp; |:white_check_mark:| TD016 | TargetEndpoint HealthMonitor | TargetEndpoint HTTPTargetConnection must use a HealthMonitor only with a LoadBalancer. |
| &nbsp; |:white_check_mark:| TD017 | TargetEndpoint URL | When TargetEndpoint HTTPTargetConnection URL is present, it should be non-empty. |
| Flow | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| FL001 | Unconditional Flows |  Only one unconditional flow will get executed. Error if more than one was detected. |
| Step | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| ST001 | Empty Step | Empty steps clutter the bundle. |
| &nbsp; |:white_check_mark:| ST002 | Step Structure | each Step should have at most one Name element, one Condition element, no others. |
| &nbsp; |:white_check_mark:| ST003 | Extract Variables Step with JSONPayload | A check for message content should be performed before policy execution. |
| &nbsp; |:white_check_mark:| ST004 | Extract Variables Step with XMLPayload | A check for message content should be performed before policy execution. |
| &nbsp; |:white_check_mark:| ST005 | Extract Variables Step with FormParam | A check for message content should be performed before policy execution. |
| &nbsp; |:white_check_mark:| ST006 | JSON Threat Protection Step | A check for message content should be performed before policy execution. |
| &nbsp; |:white_check_mark:| ST007 | XML Threat Protection Step | A check for message content should be performed before policy execution. |
| &nbsp; |:white_check_mark:| ST008 | Unreachable policies | Policies should not be attached after RaiseFault policies. |
| Policy | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| PO006 | Policy Name &amp; filename agreement |  Policy name attribute should coincide with the policy filename. |
| &nbsp; |:white_check_mark:| PO007 | Policy Naming Conventions - type indication |  It is recommended that the policy name use a prefix or follow a pattern that indicates the policy type. |
| &nbsp; |:white_check_mark:| PO008 | Policy DisplayName &amp; DisplayName agreement |  Check that the policy filename matches the display name of the policy. |
| &nbsp; |:white_medium_square:| PO009 | Service Callout Target - Mgmt Server |  Targeting management server may result in higher than expected latency; use with caution. |
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
| &nbsp; |:white_check_mark:| PO032 | CORS policy hygiene | In a CORS policy, wildcard origins should generate a warning. And other hygiene checks.|
| &nbsp; |:white_check_mark:| PO033 | ExtractVariables policy hygiene | In an ExtractVariables policy, check variable types and other hygiene. |
| &nbsp; |:white_check_mark:| PO034 | AssignMessage policy hygiene | In an AssignMessage policy, check element placement and other hygiene. |
| &nbsp; |:white_check_mark:| PO035 | Quota policy hygiene | In a Quota policy, check element placement and other hygiene. |
| &nbsp; |:white_check_mark:| PO036 | ServiceCallout Response element usage | The Response element, when present, should specify a text value and no attributes. |
| &nbsp; |:white_check_mark:| PO037 | DataCapture policy hygiene | Checks that a Capture should uses a Source of type request when the policy is attached to the Response flow, and other checks. |
| &nbsp; |:white_check_mark:| PO038 | KeyValueMapOperations policy hygiene | Checks that MapName or mapIdentifier is specified, and not both.|
| &nbsp; |:white_check_mark:| PO039 | MessageLogging policy hygiene | Checks that ResourceType is not used, or is "api".|
| &nbsp; |:white_check_mark:| PO040 | Check JSONPath within ExtractVariables policy | Checks that JSONPath compiles and is valid. |
| &nbsp; |:white_check_mark:| PO041 | KeyValueMapOperations policy and ExclusiveCache | Checks that KeyValueMapOperations policy does not use deprecated ExclusiveCache. |
| FaultRules | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| FR001 | No Condition on FaultRule | Use Condition elements on FaultRules, unless it is the fallback rule. |
| &nbsp; |:white_check_mark:| FR002 | DefaultFaultRule Structure | DefaultFaultRule should have only supported child elements, at most one AlwaysEnforce element, and at most one Condition element. |
| &nbsp; |:white_check_mark:| FR003 | single FaultRule | When a single FaultRule is present, consider using a DefaultFaultRule. |
| Conditional | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| CC001 | Literals in Conditionals |  Warn on literals in any conditional statement. |
| &nbsp; |:white_medium_square:| CC002 | Null Blank Checks |  Blank checks should also check for null conditions. (to be reviewed) |
| &nbsp; |:white_check_mark:| CC003 | Long condition statement |  Conditions should not be long. |
| &nbsp; |:white_check_mark:| CC004 | Overly complex condition |  Condition complexity should be limited to fix number of variables and conjunctions. |
| &nbsp; |:white_check_mark:| CC005 | unterminated strings in Condition |  Strings within a Condition element must be properly wrapped by double quotes. |
| &nbsp; |:white_check_mark:| CC006 | Detect logical absurdities |  Conditions should not have internal logic conflicts - warn when these are detected. |
| &nbsp; |:white_check_mark:| CC007 | Check validity of expression syntax | Condition expressions should use valid syntax. No single quotes, no extraneous or unmatched parens, etc. |
| Endpoints | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| EP001 | CORS Policy attachment | Check for multiple CORS policies, or attachment to Target Endpoint. |
| &nbsp; |:white_check_mark:| EP002 | Misplaced Elements | Check for commonly misplaced configuration elements in Proxy and Target Endpoints. |
| Features | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| FE001 | Use of Authentication element | Check for the Authentication element in policies or in Target Endpoints. |
| Deprecation | &nbsp; | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; |:white_check_mark:| DC001 | ConcurrentRateLimit Policy Deprecation |  Check usage of deprecated policy ConcurrentRateLimit. |
| &nbsp; |:white_check_mark:| DC002 | OAuth V1 Policies Deprecation |  Check usage of deprecated OAuth V1 policies. |

From an implementation perspective, the focus is on plugin support and flexibility over performance. Compute is cheap.

## Release Notes

### Release v2.31.0

#### Condition checks around policies

In release v2.31.0, the plugins PO001, PO002, PO003, PO004, and PO005 have been
converted to ST006, ST007, ST003, ST004, and ST005, respectively.  These plugins
move from the "Policy" category to the "Step" category because the plugin
analyzes the attachment of the policy in a Step element, rather than the policy
itself. Also these plugins will now generate warnings, rather than errors.

If previously you excluded PO003 via the `--excluded` option, you must now
exclude ST003, and so on.

#### Sharedflows

Starting with release v2.31.0, using apigeelint against Sharedflows will
generate a correct report. Previously the report on a sharedflow was truncated
and omitted some warnings and errors.


## Support

If you find issues, file a ticket here on Github.  Keep in mind that there is no
service level agreement (SLA) for responses to these issues. Assume all
responses are on an ad-hoc, volunteer basis.

If you simply have questions, we recommend asking on the [Apigee
forum](https://www.googlecloudcommunity.com/gc/Apigee/bd-p/cloud-apigee/) on
[GoogleCloudCommunity.com](https://www.googlecloudcommunity.com/).  Apigee
experts regularly check that forum.


Apigee customers should use [formal support channels](https://cloud.google.com/apigee/support) for Apigee product related concerns.



## License and Copyright

This material is [Copyright (c) 2018-2025 Google LLC](./NOTICE).
and is licensed under the [Apache 2.0 License](LICENSE).

## Disclaimer

This tool is open-source software. It is not an officially supported Google
product. It is not a part of Apigee, or any other officially supported Google
Product.
