//
// A peggy grammar for the Condition expressions used in Apigee.
//
//
// Copyright 2015 Apigee Corp, 2023 Google LLC.
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
//  (proxy.pathsuffix MatchesPath "/authorize") and (request.verb = "POST")
//  (proxy.pathsuffix = "/token") and (request.verb = "POST")
//  (request.verb = "POST") && (proxy.pathsuffix = "/token")
//  !(request.verb = "POST")
//  !valid
//
// Monday,  6 April 2015, 16:46
//

start
  = boolean_stmt1

boolean_stmt1
  = left:boolean_stmt2 ws+ op1:op_boolean ws+ right:boolean_stmt1 { return {operator:op1, operands:[left, right] } }
  / boolean_stmt2

boolean_stmt2
  = left:factor ws+ op1:op_boolean ws+ right:boolean_stmt2 { return {operator:op1, operands:[left,right]} }
  / factor

factor
  = "!" ws* operand:factor { return {operator:"NOT", operands:[operand] } }
  / primary


primary
  = "(" ws* t1:token ws+ op1:operator ws+ v1:value ws* ")" {
    var v = ( Object.prototype.toString.call( v1 ) === '[object Array]' ) ? v1.join("") : v1;
    return { operator:op1, operands:[t1, v]};
  }
  / ws* t1:token ws+ op1:operator ws+ v1:value {
    var v = ( Object.prototype.toString.call( v1 ) === '[object Array]' ) ? v1.join("") : v1;
    return { operator:op1, operands:[t1, v]};
  }
  / token1:token { return token1; }
  / "(" token1:token ")" { return token1; }
  / "(" stmt1:boolean_stmt1 ")" { return stmt1; }

op_boolean
  = op_and {return "AND"; }
  / op_or {return "OR"; }

op_and = "and" / "AND" / "&&"

op_or = "or" / "OR" / "||"

operator
  = op_startswith {return "StartsWith";}
  / op_notequals { return "NotEquals"; }
  / op_equals { return "Equals"; }
  / op_regexmatch {return "RegexMatch";}
  / op_matchend {return "MatchEnd?";}
  / op_matchespath {return "MatchesPath";}
  / op_greatereq {return "GreaterThanOrEquals";}
  / op_lessereq {return "LesserThanOrEquals";}
  / op_greater {return "GreaterThan";}
  / op_lesser {return "LesserThan";}

op_equals = "=" / "Equals" / "Is" / "is"

op_notequals = "!=" / "NotEquals" / "notequals" / "IsNot" / "isnot"

op_matchend = "~/" / "MatchEnd"

op_regexmatch = "~~" / "JavaRegex"

op_matchespath = "~" / "MatchesPath" / "LikePath"

op_greatereq =  ">=" / "GreaterThanOrEquals"

op_lessereq =  "<=" / "LesserThanOrEquals"

op_greater =  ">" / "GreaterThan"

op_lesser =  "<" / "LesserThan"

op_startswith =  "=|" / "StartsWith"


token
  = token:[a-zA-Z0-9_\.]+ { return token.join(""); }

value
  = '"' value:[a-zA-Z0-9_\./]* '"' { value.unshift("'"); value.push("'"); return value; }
  / "null" { return null; }
  / "false" { return false; }
  / "true" { return true; }

ws
  = [ \t]
