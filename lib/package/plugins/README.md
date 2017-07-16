# bundle-linter plugins

This utility is intended to capture the best practices knowledge from across Apigee including our Global Support Center team, Customer Success, Engineering, and our product team in a tool that will help developers create more scalable, performant, and stable API bundles using the Apigee DSL. Plugins are small Node.js modules that implement one or many event listeners and report errors and warnings.

## Plugins can lint and  check style

This tool does both traditional linting (looking for problematic patterns) and style checking (enforcement of conventions). You can use it for both. Plugin implementors are encouraged to be as creative as possible. 

## the plugin descriptor

The plugin module should export a descriptor object of the form:

```javascript

plugin = {
    ruleId: "BN001",
    name: "Bundle Structure",
    message:
      "Bundle Structure: Check bundle structure, bundles have a specific structure, extra folder or files may be problematic.",
    fatal: false,
    severity: 2, //warn
    nodeType: "Bundle",
    enabled: true
  }
```

Consider all of these fields to be mandatory. 

severity is an enum where 0 is ignore the output of this rule, 1 is a warning, or 2 is  an error.

nodeType is a description of the primary unit of evaluation by the rule. Rules may span many underlying entities (Flows, Conditions, Steps, Policies, etc) so it is left to the rule provider to decide which node is primary. nodeType is an arbitrary string, it need not be one of the objects exposed by the API.

## Listeners

Rules export functions that analyze specific units of configuration. For example a plugin that is going to review all policies in a bundle might export an onPolicy function that looks like:

```javascript
var onPolicy = function(policy) {
  var fname = policy.getFileName().split(".xml")[0];

  if (fname !== policy.getDisplayName()) {
    var result = {
      ruleId: plugin.ruleId,
      severity: plugin.severity,
      source: policy.getSource(),
      line: policy.getElement().lineNumber,
      column: policy.getElement().columnNumber,
      nodeType: plugin.nodeType,
      message:
        'Filename "' +
        policy.getName() +
        '" does not match policy display name "' +
        policy.getDisplayName() +
        '". To avoid confusion when working online and offline use the same name for files and display name in policies (excluding .xml extension).'
    };
    policy.addMessage(result);
  }
};
```

The function itself is simple - it recieves a reference to an object that represents an entity in the Apigee DSL. Methods on that object vary depending upon the type of object but generally include things like getName, getSource, etc. The function does its work and when it discovers an issue of note, it adds a message to the entity. The message object includes data from the plugin descriptor, specific information like line and column where the observation occured, etc. 

Listeners include:

```javascript
    function onBundle(bundle){};
    function onSteps(plugin.onStep){};
    function onConditions(plugin.onCondition){};
    function onProxyEndpoints(plugin.onProxyEndpoint){};
    function onTargetEndpoints(plugin.onTargetEndpoint){};
    function onResources(plugin.onResource){};
    function onPolicies(plugin.onPolicy){};
    function onFaultRules(plugin.onFaultRules){};
    function onDefaultFaultRules(plugin.onDefaultFaultRule){}Ï;
```

### addMessage

The add message method exposed by each entity is the means by which results of the linting process and rule execution get recorded. Only warnings or errors need be recorded. As an affordance to the developer a much simpler version of the msg object can be submitted of the form:

```javascript
    step.addMessage({
      plugin,
      message: "Step name is empty."
    });
```

Also note that if you need to modify the plugin descriptor to denote say a change in severity you can simply modify the field before calling addMessage as in:
```javascript
            if (error.id === "(error)") {
              plugin.severity = 2;
            }else{
              plugin.severity = 1;
            }
            resource.addMessage({
              plugin,
              source: error.evidence,
              line: error.line,
              column: error.character,
              message: error.id + ": " + error.reason
            });
```

### plugin lifecycle

Your plugin functions are called statically - meaning you don't necessarily have the opportunity to share state between invocations of a listener method unless you inject an object into the global context (generally not a good idea). If you need to share state, simply implement the onBundle listener and iterate over the various entities you care about within that function.

## Tests

Plugin developers are asked to provide reasonable tests to verify their implementation. Feel free to add testable assets such as "bad" bundles to the test directory if they enhance your tests. 

Mocha tests are preferred but not required. At some point in the future we may begin to implement some test coverage and automation. If you would like to contribute in this area, please pick up issue #28.

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style.

Add unit tests for any new or changed functionality. Lint and test your code.

From an implementation perspective the focus is on plugin support and flexibility over performance. Compute is cheap.

Codacy is king. Make sure your commits improve or maintain repo health/scoring.
