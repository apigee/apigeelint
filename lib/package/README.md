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
    	|	|	|-Flow
    	|	|		|-Condition		
    	|	|		|-Request
    	|	|		|	|-Step
    	|	|		|-Response
    	|	|			|-Step
    	|	|-PostFlow
    	|	|	|-Step
    	|	|-RouteRules
    	|	|	|-Condition
    	|	|-DefaultFaultRule
    	|	|	|-FaultRule
    	|	|-FaultRules
    	|	|	|-FaultRule
    	|	|		|-Condition
    	|	|-HTTPProxyConnection
    	|-TargetEndpoint
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
    	|	|	|-Flow
    	|	|		|-Condition		
    	|	|		|-Request
    	|	|		|	|-Step
    	|	|		|-Response
    	|	|			|-Step
    	|	|-PostFlow
    	|	|	|-Step
    	|	|-RouteRules
    	|	|	|-Condition
    	|	|-DefaultFaultRule
    	|	|	|-FaultRule
    	|	|-FaultRules
    	|	|	|-FaultRule
    	|	|		|-Condition
    	|	|-HTTPTargetConnection
    	|-Policies
    	|-Resources

RouteRules, FaultRules, DefaultFaultRule, HTTPProxyConnection, and HTTPTargetConnection are not yet implemented. 

#Processing Flow

Instantiating a bundle instantiates the top level subobjects in the following order:

1. Resources
2. Policies
3. ProxyEndpoints
4. TargetEndpoints

Nested resources are resolved lazily.

Iterating over Conditions begins with ProxyEndpoints, then proceeds to TargetEndpoints progessing through PreFlow, Flows, PostFlow, DefaultFaultRule, FaultRules, and then RouteRules. Plugins should not rely on order when processing.

Plugin methods are called in the following order:

1. checkBundle
1. checkSteps (ProxyEndpoints followed by TargetEndpoints)
1. checkConditions (ProxyEndpoints followed by TargetEndpoints)
1. checkProxyEndpoints
1. checkTargetEndpoints
1. checkResources
1. checkPolicies

Plugins that rely on a particular order should perform all work within the checkBundle phase. The entire object model is navigable (i.e. bundle.getPolicies returns all policies in the bundle, policy.getSteps returns all the steps using the policy, step.getFlow returns the flow the step lives within, etc).
