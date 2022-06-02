// applyFieldFilter.js
// ------------------------------------------------------------------
//
// Retrieve desired fields for this request, if any,
// and then apply the filter as appropriate.
//
// Example usage:
//
//    <Javascript name='JS-FilterFields-Course' timeLimit='800' >
//      <Properties>
//        <Property name='response_filter'>{verifyapikey.VerifyAPIKey-1.response_filter}</Property>
//        <Property name='source'>content-var-containing-json</Property>
//        <Property name='destination'>content-var-which-gets-transformed-result</Property>
//      </Properties>
//      <IncludeURL>jsc://fieldFiltering.js</IncludeURL>
//      <ResourceURL>jsc://applyFieldFilter.js</ResourceURL>
//    </Javascript>
//
// source is response.content by default.
// destination is response.content by default.
//
/* global applyFieldFilter:true */
/* jshint strict:implied */

// apply the field filter, and replace the response output
var isSourceUndefined = ('' + properties.source == 'undefined');
var sourceObj = context.getVariable(isSourceUndefined ? 'response.content' : properties.source);
if (sourceObj) {
  sourceObj = JSON.parse(sourceObj);
  var filter = resolve(properties.response_filter);
  if (filter) {
    var parts = filter.split(new RegExp(':'));
    if (parts && parts.length == 2) {
      var action = parts[0];
      if ((action == 'include' || action == 'exclude') && parts[1]) {
        var namedFields = parts[1].trim().split(',');
        // emit context variables for diagnostic purposes
        context.setVariable('filterAction', action);
        context.setVariable('filterFields', JSON.stringify(namedFields));
        var transformedPayload = applyFieldFilter(action, sourceObj, namedFields);
        // pretty print the output
        var isDestinationUndefined = ('' + properties.destination == 'undefined');
        context.setVariable((isDestinationUndefined) ? 'response.content' : properties.destination,
                            JSON.stringify(transformedPayload, null, 2) + '\n');

        // content is not a known variable, should be flagged by jshint
        content.setVariable('something', 'a-value');
      }
    }
  }
}


// ====================================================================

function resolve(x) {
  // resolve any variable contained within curly braces
  var re1 = new RegExp('{([^ ,}]+)}');
  if ( ! x) return null;
  var match = x.match(re1);
  if (match && match[1]) {
    return context.getVariable(match[1]);
  }
  return null;
}
