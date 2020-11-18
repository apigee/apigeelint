# Overview

This README describes some of the implementation details of apigeelint. This may
help people who want to write programs that use the apigeelint capability.

There are two main user journeys:

1. As a developer, I want to write an apigeelint plugin and I need to write tests for the plugin.

2. As a developer, I want to write a program that invokes apigeelint in the way I want.


## For Plugin Authors

As for the first journey: any developer can add their own plugin, and can even
contribute a plugin back to the apigeelint repo via a pull request. To get
started with that, the best advice is to follow the existing example code, found
in [plugins](./plugins).

When writing a plugin, be sure to also submit new tests appropriate for the
plugin.  When writing tests, most devs will simply [read the source code of existing
tests](../../test/specs) to understand what is necessary, but this README may
provide some additional perspective and information.


## For Devs who want to write their own tools

The main objective of the apigeelint project is to produce a standalone tool
that people can run interactively, or within a CI/CD pipeline, to analyze and
lint their Apigee API Proxy configurations. But because it is implemented in
nodejs module, it is possible for people to write custom code that calls into
the apigeelint library. As just one example, you might want to do this to better
control when or how linting is done.

# Basic Usage

Regardless of whether you are writing tests or writing your own tools, the basic
structure of a standalone program will be the same. First, you must initialize
your node project, and install the module:

```
npm init
npm install apigeelint
```

Then, you can write a nodejs program to analyze an API Proxy. The "hello, world" example is here:

```js
const path = require("path"),
      apigeelint = require('apigeelint'),
      bl = apigeelint.bundleLinter;

let configuration = {
        source: {
          type: "filesystem",
          path: path.resolve(__dirname, '../myproxy/apiproxy'),
          bundleType: "apiproxy"
        },
        excluded: {}
    };

bl.lint(configuration, (bundle) => {
    console.log(JSON.stringify(bundle.getReport(), null, 2));
});
```



# Object model

There is an object model supported by the bundle object returned by `bundleLinter.lint()`.

    Bundle
        |-ProxyEndpoint
        |   |-PreFlow
        |   |   |-Request
        |   |   |   |-Step
        |   |   |       |-Condition
        |   |   |       |-Name
        |   |   |       |-FaultRules
        |   |   |           |-FaultRule
        |   |   |               |-Step
        |   |   |                   |-Name
        |   |   |                   |-Condition
        |   |   |-Response
        |   |       |-Step
        |   |-Flows
        |   |   |-Flow
        |   |       |-Condition
        |   |       |-Request
        |   |       |   |-Step
        |   |       |-Response
        |   |           |-Step
        |   |-PostFlow
        |   |   |-Step
        |   |-RouteRules
        |   |   |-Condition
        |   |-DefaultFaultRule
        |   |   |-FaultRule
        |   |-FaultRules
        |   |   |-FaultRule
        |   |       |-Condition
        |   |-HTTPProxyConnection
        |-TargetEndpoint
                |   |-PreFlow
        |   |   |-Request
        |   |   |   |-Step
        |   |   |       |-Condition
        |   |   |       |-Name
        |   |   |       |-FaultRules
        |   |   |           |-FaultRule
        |   |   |               |-Step
        |   |   |                   |-Name
        |   |   |                   |-Condition
        |   |   |-Response
        |   |       |-Step
        |   |-Flows
        |   |   |-Flow
        |   |       |-Condition
        |   |       |-Request
        |   |       |   |-Step
        |   |       |-Response
        |   |           |-Step
        |   |-PostFlow
        |   |   |-Step
        |   |-RouteRules
        |   |   |-Condition
        |   |-DefaultFaultRule
        |   |   |-FaultRule
        |   |-FaultRules
        |   |   |-FaultRule
        |   |       |-Condition
        |   |-HTTPTargetConnection
        |-Policies
        |-Resources

RouteRules, FaultRules, DefaultFaultRule, HTTPProxyConnection, and HTTPTargetConnection are not yet implemented.

# Processing Flow

When your code calls `lint()` on a bundle, apigeelint reads the configuration in the following order:

1. Resources
2. Policies
3. ProxyEndpoints
4. TargetEndpoints

apigeelint resolves nested resources lazily.

When iterating over Conditions, apigeelint starts with ProxyEndpoints, then
TargetEndpoints, then through PreFlow, Flows, PostFlow, DefaultFaultRule,
FaultRules, and then RouteRules. This order is subject to change. Plugins should
not rely on order when processing.

apigeelint then invokes plugin methods in the following order:

1. onBundle
1. onSteps (ProxyEndpoints followed by TargetEndpoints)
1. onConditions (ProxyEndpoints followed by TargetEndpoints)
1. onProxyEndpoints
1. onTargetEndpoints
1. onResources
1. onPolicies
1. FaultRule
1. DefaultFaultRule

This order is subject to change. It would be safest for plugins to not depend on this order. 

Plugins that need to rely on a particular order should perform all work within the
`onBundle` phase. The entire object model is navigable. For example,
`bundle.getPolicies()` returns all policies in the bundle, `policy.getSteps()`
returns all the steps using the policy, `step.getFlow() returns the flow the
step lives within.
