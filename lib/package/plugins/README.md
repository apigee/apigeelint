# apigeelint plugins

The apigeelint utility is intended to capture the best practices knowledge from
across Apigee including our Global Support Center team, Customer Success,
Engineering, and our product team in a tool that will help developers create
more scalable, performant, and stable API bundles using the Apigee DSL.

All of the built-in function in apigeelint is implemented as plugins, stored
here in this directory. In apigeelint, plugins are small Node.js modules that
implement one or more event listeners, and can analyze the configuration of an
API Proxy, and subsequently report errors and warnings based on that analysis.

The maintainers encourage pull requests. If you're a motivated person and you
see a gap in function, please do implement a plugin and file a pull
request. Before writing a plugin, be sure to check the existing plugins to see
if it makes more sense to extend one of those.


## Plugins can lint and check style

Plugins can perform either traditional linting (looking for problematic
patterns) or style checking (enforcement of conventions), or both. The
maintainers encourage creativity in plugin implementations.


## The filename

The plugin module should have a filename like `XXDDD-pascalCasedDecriptionHere.js`, where XX is a pair of uppercase Alpha characters, and DDD is three decimal digits.  The alpha characters should correspond to the _type_ of plugin:

| prefix | a plugin focusing on... |
| ------ | ----------------------- |
| BN     | Bundle structure        |
| CC     | Conditions              |
| FL     | Flow                    |
| FR     | FaultRule               |
| PD     | Proxy Definition        |
| PO     | Policy                  |
| ST     | Steps                   |
| TD     | Target Definition       |

But these prefixes are mere convention for categorization. If you choose PO for your prefix, it does not limit the capabilities of the plugin itself.

The `DDD` decimal digits are just a unique number wihtin the specific prefix. Together the `XXDDD` comprise the
"ruleID" for the plugin, which must be unique across all plugins.


## The plugin descriptor

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

Notes:

* *ruleId* can be inferred from the filename by calling a helper function: `require("../myUtil.js").getRuleId()`

* *severity* is an enum: 0 implies ignore the output of this rule; 1 is a warning; 2 is an error.

* *nodeType* is a description of the primary unit of evaluation by the rule. Rules may span many underlying entities (Flows, Conditions, Steps, Policies, etc) so it is left to the rule provider to decide which node is primary. nodeType is an arbitrary label, it need not be one of the objects exposed by the API.

* if *enabled* is set to false, the plugiin will never run.

## Listeners

Plugins export functions that the bundle linter calls, to allow the plugin to analyze specific units of configuration. For example a plugin that checks each policy in a bundle to verify that the DisplayName matches the filename, might export an onPolicy function that looks like:

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

Your plugin module is instantiated once for the life of linter execution.

## Tests

When implementing a plugin, please provide reasonable tests to verify the
implementation. Feel free to add testable assets such as "bad" bundles to the
[test/fixtures/resources](../../../test/fixtures/resources) directory if they enhance your tests.

We prefer mocha tests. At some point in the future we may
begin to implement some test coverage and automation. If you would like to
contribute in this area, please pick up issue #28.

## Contributing

There is no formal style guide; take care to maintain the existing coding style.
Use ES9.

Add unit tests for any new or changed functionality. Lint and test your code.

From an implementation perspective the focus is on plugin support and flexibility over performance. Compute is cheap.

Codacy is king. Make sure your commits improve or maintain repo health/scoring.
