//
// A peggy grammar for the Condition expressions used in Apigee.
//
//
// Copyright 2015 Apigee Corp, 2024 Google LLC.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

//
// Examples of conditions that can be parsed by this grammar:
//
//  proxy.pathsuffix MatchesPath "/authorize" and request.verb = "POST"
//  (proxy.pathsuffix MatchesPath "/authorize") and (request.verb = "POST")
//  (proxy.pathsuffix = "/token") and (request.verb = "POST")
//  (request.verb = "POST") && (proxy.pathsuffix = "/token")
//  request.verb == "GET"
//  !(request.verb = "POST")
//  !valid
//  Not valid
//  not (request.verb = "POST")
//  NOT (request.verb = "POST")
//

{{

  function stringOp(op) {
    return ["EqualsCaseInsensitive","StartsWith","Equals", "NotEquals", "JavaRegex","MatchesPath","Matches"].includes(op);
  }
  function numericOp(op) {
    return ["Equals", "NotEquals", "GreaterThanOrEquals","GreaterThan","LesserThanOrEquals","LesserThan"].includes(op);
  }

  function parseBinaryOp(t1,op1,v1,error) {
    let isStringOp = stringOp(op1),
        isNumericOp = numericOp(op1),
        vType = Object.prototype.toString.call(v1),
        v = (vType=== '[object Array]' ) ? v1.join("") : v1;
    if (vType==='[object Number]' && !isNumericOp) {
      error("not expecting number on RHS");
    }
    if (vType!=='[object Number]' && !isStringOp) {
      error("expecting number on RHS");
    }
    return { operator:op1, operands:[t1, v]};
  }

}}


start
  = boolean_stmt1

boolean_stmt1
  = left:boolean_stmt2 ws+ op1:op_boolean ws+ right:boolean_stmt1 { return {operator:op1, operands:[left, right] } }
  / boolean_stmt2

boolean_stmt2
  = left:factor ws+ op1:op_boolean ws+ right:boolean_stmt2 { return {operator:op1, operands:[left,right]} }
  / factor

factor
  = op_not ws* operand:factor { return {operator:"NOT", operands:[operand] } }
  / primary

primary
  = "(" ws* t1:token ws+ op1:op_accepts_literal ws+ v1:value ws* ")" {
    return parseBinaryOp(t1,op1,v1,error);
  }
  / t1:token ws+ op1:op_accepts_literal ws+ v1:value {
    return parseBinaryOp(t1,op1,v1,error);
  }
  / "(" ws* t1:token ws+ op1:op_accepts_variable ws+ t2:token ws* ")" {
    return { operator:op1, operands:[t1, t2]};
  }
  / t1:token ws+ op1:op_accepts_variable ws+ t2:token {
    return { operator:op1, operands:[t1, t2]};
  }
  / token1:token { return token1; }
  / "(" token1:token ")" { return token1; }
  / "(" stmt1:boolean_stmt1 ")" { return stmt1; }

op_boolean
  = op_and {return "AND"; }
  / op_or {return "OR"; }

op_and = "and"i / "&&"

op_not = "not"i / "!"

op_or = "or"i / "||"

// Ordering is important. For operators that share a common prefix,
// list the longer, more specific operator, first.

op_accepts_literal
  = op_equalsnocase { return "EqualsCaseInsensitive"; }
  / op_startswith {return "StartsWith";}
  / op_equals { return "Equals"; }
  / op_notequals { return "NotEquals"; }
  / op_greatereq {return "GreaterThanOrEquals";}
  / op_greater {return "GreaterThan";}
  / op_lessereq {return "LesserThanOrEquals";}
  / op_lesser {return "LesserThan";}
  / op_regexmatch {return "JavaRegex";}
  / op_matchespath {return "MatchesPath";}
  / op_matches {return "Matches";}

op_accepts_variable
  = op_startswith {return "StartsWith";}
  / op_equals { return "Equals"; }
  / op_notequals { return "NotEquals"; }
  / op_greatereq {return "GreaterThanOrEquals";}
  / op_greater {return "GreaterThan";}
  / op_lessereq {return "LesserThanOrEquals";}
  / op_lesser {return "LesserThan";}


op_equals = "==" / "=" / "Equals"i / "Is"i

op_notequals = "!=" / "NotEquals"i / "IsNot"i

op_equalsnocase = ":=" / "EqualsCaseInsensitive"i

op_greater =  ">" / "GreaterThan"i

op_greatereq =  ">=" / "GreaterThanOrEquals"i

op_lesser =  "<" / "LesserThan"i

op_lessereq =  "<=" / "LesserThanOrEquals"i

op_regexmatch = "~~" / "JavaRegex"i

op_matches = "~" / "Matches"i / "Like"i

op_matchespath = "~/" / "MatchesPath"i / "LikePath"i

op_startswith =  "=|" / "StartsWith"i


frac_string
    = "." int1:DecimalIntegerLiteral { return "." + chars.join(''); }

DecimalLiteral
  = "-"? DecimalIntegerLiteral "." DecimalDigit|1..10|  {
      return { type: "Literal", value: parseFloat(text()) };
    }
  / "." DecimalDigit|1..10|  {
      return { type: "Literal", value: parseFloat(text()) };
    }
  / "-"? DecimalIntegerLiteral {
      return { type: "Literal", value: parseInt(text()) };
    }

DecimalIntegerLiteral
  = "0"
  / NonZeroDigit DecimalDigit|0..9|

DecimalDigit
  = [0-9]

NonZeroDigit
  = [1-9]

alpha
  = [a-zA-Z]

token
  = alpha [-a-zA-Z0-9_\.]* { return text(); }

value
  = '"' value:[^"]* '"' { value.unshift("'"); value.push("'"); return value; }
  / "null" { return null; }
  / "false" { return false; }
  / "true" { return true; }
  / value:DecimalLiteral { return value.value; }

ws
  = [ \t\n]