// fieldFiltering.js
// ------------------------------------------------------------------
//
// Logic for filtering fields (include or exclude) from a JSON hash.
// There is one public method that gets exposed.
//
//  function applyFieldFilter(action, obj, fields) {...}
//
//    @action : 'include' or 'exclude'
//    @obj : a JS hash
//    @fields: an array of strings, referring to fields within the hash
//
// Example 1:
// assume a JS hash like this:
// {
//   prop1 : 7,
//   prop2 : [ 1, 2, 3, 4],
//   prop3 : {
//     key1 : 'A',
//     key2 : null,
//     key3 : true
//   }
// }
//
// With action = 'include' and the fields array like this:
// ['prop1', 'prop3.key1']
//
// ...the output will be a hash like so:
//
// {
//   prop1 : 7,
//   prop3 : {
//     key1 : 'A'
//   }
// }
//
// Example 1a:
// The same result can be achieved using a GraphQL expression. The equivalent to
// the above example is:
//
// "{ prop1 prop3 { key1 } }"
//
//
// Example 2:
// assume a JS hash like this:
// {
//   prop1 : 7,
//   prop2 : [ 1, 2, 3, 4],
//   data : [{
//     key1 : 'A',
//     key2 : null,
//     key3 : true
//   },{
//     key1 : 'B',
//     key2 : null,
//     key3 : null
//   },{
//     key1 : 'C',
//     key2 : null,
//     key3 : false
//   }]
// }
//
// With action = 'include' and the fields array like this:
// ['prop2', 'data.key1']
//
// ...the output will be:
//
// {
//   prop2 : [ 1, 2, 3, 4],
//   data : [{
//     key1 : 'A'
//   },{
//     key1 : 'B',
//   },{
//     key1 : 'C',
//   }]
// }
//
//
// Example 3:
// assume the same JS hash as above.
//
// With action = 'exclude' and the fields array like this:
// ['prop2', 'data.key1']
//
// ...the output will be:
//
// {
//   prop1 : 7,
//   data : [{
//     key2 : null,
//     key3 : true
//   },{
//     key2 : null,
//     key3 : null
//   },{
//     key2 : null,
//     key3 : false
//   }]
// }
//
//
// created: Mon Apr 11 17:48:59 2016
// last saved: <2016-April-15 17:41:03>
/* global exports:true */
/* jshint strict:implied */


(function (){

  function _produceHash(fieldname) {
    var parent = { "x" : {} },
        currenthash = parent,
        currentprop = 'x',
        parts = fieldname.split('.');
    parts.forEach(function(part){
      if ( currenthash[currentprop] === true) {
        currenthash[currentprop] = {};
      }
      currenthash[currentprop][part] = true;
      currenthash = currenthash[currentprop];
      currentprop = part;
    });
    return parent.x;
  }

  function _deepmerge() {
    var destination = {},
        sources = [].slice.call( arguments, 0 );
    sources.forEach(function( source ) {
      var prop;
      Object.keys(source).forEach(function(prop) {
        if ( prop in destination && Array.isArray( destination[ prop ] ) ) {
          // Concat Arrays
          destination[ prop ] = destination[ prop ].concat( source[ prop ] );
        } else if ( prop in destination && typeof destination[ prop ] === "object" ) {
          // Merge Objects
          destination[ prop ] = _deepmerge( destination[ prop ], source[ prop ] );
        } else {
          // Set new values
          destination[ prop ] = source[ prop ];
        }
      });
    });
    return destination;
  }

  function _elaborateFields(fields, prefix) {
    // input is either an array of field names
    // or a graphql expression.
    if (Array.isArray(fields) ) {
      // in: ['prop1', 'prop3.key1']
      // out: { "prop1": true, "prop3" : { "key1" : true } }
      fields.sort();
      prefix = prefix || "";
      // elaborate the field list to find references to nested fields
      var elabfields = {};
      fields.forEach(function(field) {
        elabfields = _deepmerge(elabfields, _produceHash(field));
      });
      return elabfields;
    }

    if (typeof fields === 'string' ){
      // transform GraphQL string into a hash of the desired kind.
      // in: { prop1 prop3 { key1 } }
      // out: { "prop1": true, "prop3" : { "key1" : true } }
      //
      fields = fields.replace(new RegExp('\\s+', 'g'), ' ')
        .replace(new RegExp('(.){', 'g'), '$1: {')
        .replace(new RegExp('([a-zA-Z_$][\\w$]*)(\\s+)', 'g'), '"$1" ')
        .replace(new RegExp('"\\s+(?!:)', 'g'), '" : true,')
        .replace(new RegExp(',\\s*}', 'g'), '}');
      return JSON.parse(fields);
    }
    return null;
  }


  function _includeFields(obj, fieldset) {
    if (Array.isArray(obj)) {
      return obj.map(function(item) {
        _includeFields(item, fieldset);
      });
    }

    var newObj = {};
    Object.keys(fieldset).forEach(function(key) {
      if (obj.hasOwnProperty(key)) {
        if (fieldset[key] === true) {
          // pass the property through unchanged
          newObj[key] = obj[key];
        }
        else {
          // means this is a set of nested fields
          var o = obj[key];
          newObj[key] = (Array.isArray(o)) ?
            // o, the child in the source object, is an array.
            // Therefore apply the included fields
            o.map(function(item) { return _includeFields(item, fieldset[key]); }) :
            // the child is not an array; presume a nested hash
            _includeFields(o, fieldset[key]);

        }
      }
    });
    return newObj;
  }


  function _excludeFields(obj, fieldset) {

    if (Array.isArray(obj)) {
      return obj.map(function(item) { _excludeFields(item, fieldset); });
    }
    var newObj = {};
    Object.keys(obj).forEach(function(key){
      if ( ! fieldset.hasOwnProperty(key)) {
        // copy through properties not explicitly excluded
        newObj[key] = obj[key];
      }
      else if (fieldset[key] !== true) {
        // means this is a set of nested fields to exclude
        var o = obj[key];
        newObj[key] = (Array.isArray(o)) ?
          // o, the child in the source object, is an array.
        // Therefore apply the excluded fields.
        o.map(function(item) { return _excludeFields(item, fieldset[key]); }):
          // the child is not an array; presume a nested hash
        newObj[key] = _excludeFields(o, fieldset[key]);
      }
    });
    return newObj;
  }

  function applyFieldFilter(action, obj, fields) {
    if ( !fields || fields.length === 0) {
      return obj;  // no change
    }
    var elabfields = _elaborateFields(fields);
    var newObj = ((action == 'exclude')?_excludeFields:_includeFields)(obj, elabfields);
    return newObj;
  }

  // export into the global namespace
  if (typeof exports === "object" && exports) {
    // works for nodejs
    exports.applyFieldFilter = applyFieldFilter;
  }
  else {
    // works in rhino
    var globalScope = (function(){ return this; }).call(null);
    globalScope.applyFieldFilter = applyFieldFilter;
  }

}());
