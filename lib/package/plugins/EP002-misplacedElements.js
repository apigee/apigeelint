/*
  Copyright 2019-2022 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const ruleId = require("../myUtil.js").getRuleId(),
      debug = require("debug")("apigeelint:" + ruleId),
      xpath = require("xpath");

const plugin = {
        ruleId,
        name: "Check for commonly misplaced elements",
        message:
        "For example, a Flow element should be a child of Flows parent.",
        fatal: false,
        severity: 2, // error
        nodeType: "Endpoint",
        enabled: true
      };

const onProxyEndpoint = function(endpoint, cb) {
        debug('onProxyEndpoint');
        let checker = new EndpointChecker(endpoint, true);
        let flagged = checker.check();
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

const onTargetEndpoint = function(endpoint, cb) {
        debug('onTargetEndpoint');
        let checker = new EndpointChecker(endpoint, false);
        let flagged = checker.check();
        if (typeof(cb) == 'function') {
          cb(null, flagged);
        }
      };

const _markEndpoint = (endpoint, message, line, column) => {
        var result = {
              ruleId: plugin.ruleId,
              severity: plugin.severity,
              nodeType: plugin.nodeType,
              message,
              line,
              column,
            };
        // discard duplicates
        if ( !line || !column || !endpoint.report.messages.find(m => m.line == line && m.column == column)) {
          endpoint.addMessage(result);
        }
      };

const allowedParents = {
        Step: ['Request', 'Response', 'FaultRule', 'DefaultFaultRule'],
        Request: ['PreFlow', 'PostFlow', 'Flow', 'PostClientFlow', 'HTTPMonitor'],
        Response: ['PreFlow', 'PostFlow', 'Flow', 'PostClientFlow'],
        Flows: ['ProxyEndpoint', 'TargetEndpoint'],
        Flow: ['Flows'],
        RouteRule: ['ProxyEndpoint'],
        DefaultFaultRule: ['ProxyEndpoint', 'TargetEndpoint'],
        HTTPTargetConnection: ['TargetEndpoint'],
        LoadBalancer:  ['HTTPTargetConnection'],
        HealthMonitor: ['HTTPTargetConnection'],
        HTTPMonitor: ['HealthMonitor'],
        TCPMonitor: ['HealthMonitor'],
        SuccessResponse: ['HTTPMonitor']
      };

const allowedChildren = {
        Step: ['Name', 'Condition'],
        Request: ['Step'],
        'Request-child-of-HTTPMonitor': ['ConnectTimeoutInSec', 'SocketReadTimeoutInSec', 'Payload', 'IsSSL', 'TrustAllSSL', 'Port', 'Verb', 'Path', 'Header', 'IncludeHealthCheckIdHeader'],
        Response: ['Step'],
        Flows: ['Flow'],
        Flow: ['Description', 'Request', 'Response', 'Condition'],
        RouteRule: ['Condition', 'TargetEndpoint'],
        DefaultFaultRule: ['Step', 'AlwaysEnforce'],
        HTTPTargetConnection: ['LoadBalancer', 'Properties', 'Path', 'HealthMonitor', 'URL', 'Authentication'],
        LoadBalancer: ['Algorithm', 'Server', 'MaxFailures', 'ServerUnhealthyResponse', 'RetryEnabled', 'TargetDisableSecs'],
        HealthMonitor: ['IsEnabled', 'IntervalInSec', 'HTTPMonitor', 'TCPMonitor'],
        HTTPMonitor: ['Request', 'SuccessResponse'],
        TCPMonitor: ['ConnectTimeoutInSec', 'Port'],
        SuccessResponse: ['ResponseCode', 'Header'],
        ProxyEndpoint: ['PreFlow', 'PostFlow', 'Flows', 'RouteRule', 'PostClientFlow',
                       'Description', 'FaultRules', 'DefaultFaultRule', 'HTTPProxyConnection'],
        TargetEndpoint: ['PreFlow', 'PostFlow', 'Flows',
                         'Description', 'FaultRules', 'DefaultFaultRule',
                         'LocalTargetConnection', 'HTTPTargetConnection']
      };

class EndpointChecker {
  constructor(endpoint, isProxyEndpoint) {
    debug('EndpointChecker ctor (%s)', endpoint.getName());
    this.endpoint = endpoint;
    this.isProxyEndpoint = isProxyEndpoint;
    this.flagged = false;
  }

  check() {
    try {
      const self = this;

      let ep = self.isProxyEndpoint ? 'ProxyEndpoint': 'TargetEndpoint';
      let topLevelChildren = xpath.select("*", self.endpoint.element);
      topLevelChildren.forEach(child => {
        if (allowedChildren[ep].indexOf(child.tagName)< 0) {
          self.flagged = true;
          _markEndpoint(self.endpoint, `Invalid ${child.tagName} element`, child.lineNumber, child.columnNumber);
        }
      });

      // 1st level children that must have at most one instance: Flows, DFR
      ['Flows', 'DefaultFaultRule', 'FaultRules'].forEach( elementName => {
        let elements = xpath.select(`${elementName}`, self.endpoint.element);
        if (elements.length != 0 && elements.length != 1) {
          self.flagged = true;
          elements.slice(1)
            .forEach(element =>
                     _markEndpoint(self.endpoint, `Extra ${elementName} element`,
                                   element.lineNumber, element.columnNumber));
        }
      });

      // Request, Response, Step, Flow, DefaultFaultRule, RouteRule
      let condition = Object.keys(allowedParents).map(n => `self::${n}`).join(' or ');
      let elements = xpath.select(`//*[${condition}]`, self.endpoint.element);
      elements.forEach(element => {
        let tagName = element.tagName;
        // misplaced children of toplevel elements are covered above
        if (element.parentNode.tagName != 'ProxyEndpoint' &&
            element.parentNode.tagName != 'TargetEndpoint') {
          if (allowedParents[tagName].indexOf(element.parentNode.tagName)<0) {
            self.flagged = true;
            _markEndpoint(self.endpoint, `Misplaced ${tagName} element child of ${element.parentNode.tagName}`, element.lineNumber, element.columnNumber);
          }
        }
        let children = xpath.select("*", element);
        children.forEach(child => {
          // special case Request, there are two of them
          let t = (tagName == 'Request' && element.parentNode.tagName == 'HTTPMonitor') ?
            'Request-child-of-HTTPMonitor' : tagName;

          if (allowedChildren[t].indexOf(child.tagName)<0) {
            self.flagged = true;
            _markEndpoint(self.endpoint, `Misplaced '${child.tagName}' element child of ${tagName}`,
                          child.lineNumber, child.columnNumber);
          }
        });
      });

      // exactly one of LocalTarget and HTTPTarget is required
      if (! self.isProxyEndpoint) {
        let condition = ['LocalTargetConnection', 'HTTPTargetConnection'].map(n => `self::${n}`).join(' or ');
        let targetChildren = xpath.select(`*[${condition}]`, self.endpoint.element);
        if (targetChildren.length == 0) {
          self.flagged = true;
          _markEndpoint(self.endpoint, `Missing a required *TargetConnection`, 1, 2);
        }
        else if (targetChildren.length != 1) {
          self.flagged = true;
          targetChildren.slice(1)
            .forEach(configElement =>
                     _markEndpoint(self.endpoint, `${configElement.tagName} element conflicts with ${targetChildren[0].tagName} on line ${targetChildren[0].lineNumber}`,
                                   configElement.lineNumber, configElement.columnNumber));
        }
      }

      // in HealthMonitor, exactly one of HTTPMonitor or TCPMonitor is required
      if (! self.isProxyEndpoint) {
        let healthMonitors = xpath.select(`HTTPTargetConnection/HealthMonitor`, self.endpoint.element);

        if (healthMonitors.length > 1) {
          self.flagged = true;
          healthMonitors.slice(1)
            .forEach(elt =>
                     _markEndpoint(self.endpoint, `Redundant HealthMonitor element`, elt.lineNumber, elt.columnNumber));
        }
        if (healthMonitors.length > 0) {
          let condition = ['HTTP', 'TCP'].map(n => `self::${n}Monitor`).join(' or ');
          let monitors = xpath.select(`*[${condition}]`, healthMonitors[0]);
          if (monitors.length != 1) {
            self.flagged = true;
            monitors.slice(1)
              .forEach(configElement =>
                       _markEndpoint(self.endpoint, `${configElement.tagName} element conflicts with ${monitors[0].tagName} on line ${monitors[0].lineNumber}`,
                                     configElement.lineNumber, configElement.columnNumber));
          }
        }
      }
      // future: add other checks here.

      return this.flagged;
    }
    catch(e) {
      console.log(e);
      return false;
    }
  }
}


module.exports = {
  plugin,
  onProxyEndpoint,
  onTargetEndpoint
};
