/* jshint esversion:6, node:true, strict:implied */
/* global context */

var r = JSON.parse(context.getVariable('abacResponse.content'));

// r.values is: array of array
// example:
//   [ [ 'partner', '/v1/foo', 'GET', 'TRUE' ],
//     [ ],
//     [ 'employee', '/v1/foo', 'GET', 'TRUE' ],
//     [ 'employee', '/v1/foo', 'POST', 'TRUE' ],
//     [ 'employee', '/v1/foo', 'DELETE', 'FALSE' ],
//     [ 'admin', '/v1/foo', 'DELETE', 'FALSE' ] ]

// There will be an empty inner array if the line in the sheet is empty.
// Let's filter those rows out.

var values = r.values.filter(function(row) {
    return row &&
      (row.length == 4) &&
      (row[3] == 'TRUE' || row[3] == 'FALSE');
    });

context.setVariable('abac_rules', JSON.stringify(values));
