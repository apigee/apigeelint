#Object model

Bundle
	|-ProxyEndpoint
	|	|-PreFlow
	|	|	|-Request
	|	|	|	|-Step
	|	|	|		|-Condition
	|	|	|		|-Name
	|	|	|		|-FaultRules
	|	|	|			|-FaultRule
	|	|	|				|-Step
	|	|	|					|-Name
	|	|	|					|-Condition
	|	|	|-Response
	|	|		|-Step
	|	|-Flows
	|	|	|-Request
	|	|	|-Response
	|	|-PostFlow
	|	|	|-Step
	|	|-RouteRules
	|	|	|-Condition
	|	|-DefaultFaultRule
	|	|	|-FaultRule
	|	|-FaultRules
	|	|	|-FaultRule
	|	|-HTTPProxyConnection
	|-TargetEndpoint
	|	|-PreFlow
	|	|-Flows
	|	|-PostFlow
	|	|-DefaultFaultRule
	|	|-FaultRules
	|	|-HTTPTargetConnection
	|-Policies
	|-Resources

RouteRules, FaultRules, DefaultFaultRule, HTTPProxyConnection, and HTTPTargetConnection are not yet implemented. 

#Processing Flow

Instantiating a bundle instantiates the top level subobjects in the following order:
	1. Resources - TBD
	2. Policies
	3. ProxyEndpoints
	4. TargetEndpoints

Nested resources are resolved lazily.

Iterating over Conditions begins with ProxyEndpoints, then proceeds to TargetEndpoints progessing through PreFlow, Flows, PostFlow, DefaultFaultRule, FaultRules, and then RouteRules (ProxyEndpoints only). Plugins should not rely on order when processing.

Plugin methods are called in the following order:
	1. checkBundle
	2. checkResources
	3. checkPolicies
	4. checkSteps (ProxyEndpoints followed by TargetEndpoints)
	5. checkConditions (ProxyEndpoints followed by TargetEndpoints)
	6. checkProxyEndpoints
	7. checkTargetEndpoints

Plugins that rely a particular order should perform all work within the checkBundle phase. The entire object model is navigable (i.e. bundle.getPolicies returns all policies in the bundle, policy.getSteps returns all the steps using the policy, step.getFlow returns the flow the step lives within, etc).