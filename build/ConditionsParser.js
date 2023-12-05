// Generated by Peggy 3.0.2.
//
// https://peggyjs.org/

"use strict";

function peg$subclass(child, parent) {
  function C() { this.constructor = child; }
  C.prototype = parent.prototype;
  child.prototype = new C();
}

function peg$SyntaxError(message, expected, found, location) {
  var self = Error.call(this, message);
  // istanbul ignore next Check is a necessary evil to support older environments
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(self, peg$SyntaxError.prototype);
  }
  self.expected = expected;
  self.found = found;
  self.location = location;
  self.name = "SyntaxError";
  return self;
}

peg$subclass(peg$SyntaxError, Error);

function peg$padEnd(str, targetLength, padString) {
  padString = padString || " ";
  if (str.length > targetLength) { return str; }
  targetLength -= str.length;
  padString += padString.repeat(targetLength);
  return str + padString.slice(0, targetLength);
}

peg$SyntaxError.prototype.format = function(sources) {
  var str = "Error: " + this.message;
  if (this.location) {
    var src = null;
    var k;
    for (k = 0; k < sources.length; k++) {
      if (sources[k].source === this.location.source) {
        src = sources[k].text.split(/\r\n|\n|\r/g);
        break;
      }
    }
    var s = this.location.start;
    var offset_s = (this.location.source && (typeof this.location.source.offset === "function"))
      ? this.location.source.offset(s)
      : s;
    var loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
    if (src) {
      var e = this.location.end;
      var filler = peg$padEnd("", offset_s.line.toString().length, ' ');
      var line = src[s.line - 1];
      var last = s.line === e.line ? e.column : line.length + 1;
      var hatLen = (last - s.column) || 1;
      str += "\n --> " + loc + "\n"
          + filler + " |\n"
          + offset_s.line + " | " + line + "\n"
          + filler + " | " + peg$padEnd("", s.column - 1, ' ')
          + peg$padEnd("", hatLen, "^");
    } else {
      str += "\n at " + loc;
    }
  }
  return str;
};

peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
    literal: function(expectation) {
      return "\"" + literalEscape(expectation.text) + "\"";
    },

    class: function(expectation) {
      var escapedParts = expectation.parts.map(function(part) {
        return Array.isArray(part)
          ? classEscape(part[0]) + "-" + classEscape(part[1])
          : classEscape(part);
      });

      return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
    },

    any: function() {
      return "any character";
    },

    end: function() {
      return "end of input";
    },

    other: function(expectation) {
      return expectation.description;
    }
  };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/"/g,  "\\\"")
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g,          function(ch) { return "\\x0" + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return "\\x"  + hex(ch); });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/\]/g, "\\]")
      .replace(/\^/g, "\\^")
      .replace(/-/g,  "\\-")
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g,          function(ch) { return "\\x0" + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return "\\x"  + hex(ch); });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = expected.map(describeExpectation);
    var i, j;

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + " or " + descriptions[1];

      default:
        return descriptions.slice(0, -1).join(", ")
          + ", or "
          + descriptions[descriptions.length - 1];
    }
  }

  function describeFound(found) {
    return found ? "\"" + literalEscape(found) + "\"" : "end of input";
  }

  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};

function peg$parse(input, options) {
  options = options !== undefined ? options : {};

  var peg$FAILED = {};
  var peg$source = options.grammarSource;

  var peg$startRuleFunctions = { start: peg$parsestart };
  var peg$startRuleFunction = peg$parsestart;

  var peg$c0 = "!";
  var peg$c1 = "(";
  var peg$c2 = ")";
  var peg$c3 = "and";
  var peg$c4 = "AND";
  var peg$c5 = "&&";
  var peg$c6 = "or";
  var peg$c7 = "OR";
  var peg$c8 = "||";
  var peg$c9 = "=";
  var peg$c10 = "Equals";
  var peg$c11 = "Is";
  var peg$c12 = "is";
  var peg$c13 = "!=";
  var peg$c14 = "NotEquals";
  var peg$c15 = "notequals";
  var peg$c16 = "IsNot";
  var peg$c17 = "isnot";
  var peg$c18 = "~/";
  var peg$c19 = "MatchEnd";
  var peg$c20 = "~~";
  var peg$c21 = "JavaRegex";
  var peg$c22 = "~";
  var peg$c23 = "MatchesPath";
  var peg$c24 = "LikePath";
  var peg$c25 = ">=";
  var peg$c26 = "GreaterThanOrEquals";
  var peg$c27 = "<=";
  var peg$c28 = "LesserThanOrEquals";
  var peg$c29 = ">";
  var peg$c30 = "GreaterThan";
  var peg$c31 = "<";
  var peg$c32 = "LesserThan";
  var peg$c33 = "=|";
  var peg$c34 = "StartsWith";
  var peg$c35 = "\"";
  var peg$c36 = "null";
  var peg$c37 = "false";
  var peg$c38 = "true";

  var peg$r0 = /^[a-zA-Z0-9_.]/;
  var peg$r1 = /^[a-zA-Z0-9_.\/]/;
  var peg$r2 = /^[ \t]/;

  var peg$e0 = peg$literalExpectation("!", false);
  var peg$e1 = peg$literalExpectation("(", false);
  var peg$e2 = peg$literalExpectation(")", false);
  var peg$e3 = peg$literalExpectation("and", false);
  var peg$e4 = peg$literalExpectation("AND", false);
  var peg$e5 = peg$literalExpectation("&&", false);
  var peg$e6 = peg$literalExpectation("or", false);
  var peg$e7 = peg$literalExpectation("OR", false);
  var peg$e8 = peg$literalExpectation("||", false);
  var peg$e9 = peg$literalExpectation("=", false);
  var peg$e10 = peg$literalExpectation("Equals", false);
  var peg$e11 = peg$literalExpectation("Is", false);
  var peg$e12 = peg$literalExpectation("is", false);
  var peg$e13 = peg$literalExpectation("!=", false);
  var peg$e14 = peg$literalExpectation("NotEquals", false);
  var peg$e15 = peg$literalExpectation("notequals", false);
  var peg$e16 = peg$literalExpectation("IsNot", false);
  var peg$e17 = peg$literalExpectation("isnot", false);
  var peg$e18 = peg$literalExpectation("~/", false);
  var peg$e19 = peg$literalExpectation("MatchEnd", false);
  var peg$e20 = peg$literalExpectation("~~", false);
  var peg$e21 = peg$literalExpectation("JavaRegex", false);
  var peg$e22 = peg$literalExpectation("~", false);
  var peg$e23 = peg$literalExpectation("MatchesPath", false);
  var peg$e24 = peg$literalExpectation("LikePath", false);
  var peg$e25 = peg$literalExpectation(">=", false);
  var peg$e26 = peg$literalExpectation("GreaterThanOrEquals", false);
  var peg$e27 = peg$literalExpectation("<=", false);
  var peg$e28 = peg$literalExpectation("LesserThanOrEquals", false);
  var peg$e29 = peg$literalExpectation(">", false);
  var peg$e30 = peg$literalExpectation("GreaterThan", false);
  var peg$e31 = peg$literalExpectation("<", false);
  var peg$e32 = peg$literalExpectation("LesserThan", false);
  var peg$e33 = peg$literalExpectation("=|", false);
  var peg$e34 = peg$literalExpectation("StartsWith", false);
  var peg$e35 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_", "."], false, false);
  var peg$e36 = peg$literalExpectation("\"", false);
  var peg$e37 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_", ".", "/"], false, false);
  var peg$e38 = peg$literalExpectation("null", false);
  var peg$e39 = peg$literalExpectation("false", false);
  var peg$e40 = peg$literalExpectation("true", false);
  var peg$e41 = peg$classExpectation([" ", "\t"], false, false);

  var peg$f0 = function(left, op1, right) { return {operator:op1, operands:[left, right] } };
  var peg$f1 = function(left, op1, right) { return {operator:op1, operands:[left,right]} };
  var peg$f2 = function(operand) { return {operator:"NOT", operands:[operand] } };
  var peg$f3 = function(t1, op1, v1) {
    var v = ( Object.prototype.toString.call( v1 ) === '[object Array]' ) ? v1.join("") : v1;
    return { operator:op1, operands:[t1, v]};
  };
  var peg$f4 = function(t1, op1, v1) {
    var v = ( Object.prototype.toString.call( v1 ) === '[object Array]' ) ? v1.join("") : v1;
    return { operator:op1, operands:[t1, v]};
  };
  var peg$f5 = function(token1) { return token1; };
  var peg$f6 = function(token1) { return token1; };
  var peg$f7 = function(stmt1) { return stmt1; };
  var peg$f8 = function() {return "AND"; };
  var peg$f9 = function() {return "OR"; };
  var peg$f10 = function() {return "StartsWith";};
  var peg$f11 = function() { return "NotEquals"; };
  var peg$f12 = function() { return "Equals"; };
  var peg$f13 = function() {return "RegexMatch";};
  var peg$f14 = function() {return "MatchEnd?";};
  var peg$f15 = function() {return "MatchesPath";};
  var peg$f16 = function() {return "GreaterThanOrEquals";};
  var peg$f17 = function() {return "LesserThanOrEquals";};
  var peg$f18 = function() {return "GreaterThan";};
  var peg$f19 = function() {return "LesserThan";};
  var peg$f20 = function(token) { return token.join(""); };
  var peg$f21 = function(value) { value.unshift("'"); value.push("'"); return value; };
  var peg$f22 = function() { return null; };
  var peg$f23 = function() { return false; };
  var peg$f24 = function() { return true; };
  var peg$currPos = 0;
  var peg$savedPos = 0;
  var peg$posDetailsCache = [{ line: 1, column: 1 }];
  var peg$maxFailPos = 0;
  var peg$maxFailExpected = [];
  var peg$silentFails = 0;

  var peg$result;

  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function offset() {
    return peg$savedPos;
  }

  function range() {
    return {
      source: peg$source,
      start: peg$savedPos,
      end: peg$currPos
    };
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function expected(description, location) {
    location = location !== undefined
      ? location
      : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location
    );
  }

  function error(message, location) {
    location = location !== undefined
      ? location
      : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildSimpleError(message, location);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
  }

  function peg$anyExpectation() {
    return { type: "any" };
  }

  function peg$endExpectation() {
    return { type: "end" };
  }

  function peg$otherExpectation(description) {
    return { type: "other", description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos];
    var p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;

      return details;
    }
  }

  function peg$computeLocation(startPos, endPos, offset) {
    var startPosDetails = peg$computePosDetails(startPos);
    var endPosDetails = peg$computePosDetails(endPos);

    var res = {
      source: peg$source,
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column
      }
    };
    if (offset && peg$source && (typeof peg$source.offset === "function")) {
      res.start = peg$source.offset(res.start);
      res.end = peg$source.offset(res.end);
    }
    return res;
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) { return; }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildSimpleError(message, location) {
    return new peg$SyntaxError(message, null, null, location);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location
    );
  }

  function peg$parsestart() {
    var s0;

    s0 = peg$parseboolean_stmt1();

    return s0;
  }

  function peg$parseboolean_stmt1() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parseboolean_stmt2();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parsews();
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsews();
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseop_boolean();
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$parsews();
          if (s5 !== peg$FAILED) {
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsews();
            }
          } else {
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseboolean_stmt1();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s0 = peg$f0(s1, s3, s5);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseboolean_stmt2();
    }

    return s0;
  }

  function peg$parseboolean_stmt2() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parsefactor();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parsews();
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsews();
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseop_boolean();
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$parsews();
          if (s5 !== peg$FAILED) {
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsews();
            }
          } else {
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseboolean_stmt2();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s0 = peg$f1(s1, s3, s5);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parsefactor();
    }

    return s0;
  }

  function peg$parsefactor() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 33) {
      s1 = peg$c0;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e0); }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parsews();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parsews();
      }
      s3 = peg$parsefactor();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f2(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseprimary();
    }

    return s0;
  }

  function peg$parseprimary() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c1;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e1); }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parsews();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parsews();
      }
      s3 = peg$parsetoken();
      if (s3 !== peg$FAILED) {
        s4 = [];
        s5 = peg$parsews();
        if (s5 !== peg$FAILED) {
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parsews();
          }
        } else {
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseoperator();
          if (s5 !== peg$FAILED) {
            s6 = [];
            s7 = peg$parsews();
            if (s7 !== peg$FAILED) {
              while (s7 !== peg$FAILED) {
                s6.push(s7);
                s7 = peg$parsews();
              }
            } else {
              s6 = peg$FAILED;
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$parsevalue();
              if (s7 !== peg$FAILED) {
                s8 = [];
                s9 = peg$parsews();
                while (s9 !== peg$FAILED) {
                  s8.push(s9);
                  s9 = peg$parsews();
                }
                if (input.charCodeAt(peg$currPos) === 41) {
                  s9 = peg$c2;
                  peg$currPos++;
                } else {
                  s9 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$e2); }
                }
                if (s9 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s0 = peg$f3(s3, s5, s7);
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsews();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsews();
      }
      s2 = peg$parsetoken();
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parsews();
        if (s4 !== peg$FAILED) {
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsews();
          }
        } else {
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseoperator();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parsews();
            if (s6 !== peg$FAILED) {
              while (s6 !== peg$FAILED) {
                s5.push(s6);
                s6 = peg$parsews();
              }
            } else {
              s5 = peg$FAILED;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsevalue();
              if (s6 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f4(s2, s4, s6);
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsetoken();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$f5(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 40) {
            s1 = peg$c1;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e1); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parsetoken();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 41) {
                s3 = peg$c2;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$e2); }
              }
              if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f6(s2);
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 40) {
              s1 = peg$c1;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$e1); }
            }
            if (s1 !== peg$FAILED) {
              s2 = peg$parseboolean_stmt1();
              if (s2 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 41) {
                  s3 = peg$c2;
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$e2); }
                }
                if (s3 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s0 = peg$f7(s2);
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parseop_boolean() {
    var s0, s1;

    s0 = peg$currPos;
    s1 = peg$parseop_and();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f8();
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseop_or();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f9();
      }
      s0 = s1;
    }

    return s0;
  }

  function peg$parseop_and() {
    var s0;

    if (input.substr(peg$currPos, 3) === peg$c3) {
      s0 = peg$c3;
      peg$currPos += 3;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e3); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 3) === peg$c4) {
        s0 = peg$c4;
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e4); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c5) {
          s0 = peg$c5;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e5); }
        }
      }
    }

    return s0;
  }

  function peg$parseop_or() {
    var s0;

    if (input.substr(peg$currPos, 2) === peg$c6) {
      s0 = peg$c6;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e6); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c7) {
        s0 = peg$c7;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e7); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c8) {
          s0 = peg$c8;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e8); }
        }
      }
    }

    return s0;
  }

  function peg$parseoperator() {
    var s0, s1;

    s0 = peg$currPos;
    s1 = peg$parseop_startswith();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f10();
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseop_notequals();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f11();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseop_equals();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$f12();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseop_regexmatch();
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f13();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseop_matchend();
            if (s1 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$f14();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseop_matchespath();
              if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f15();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseop_greatereq();
                if (s1 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$f16();
                }
                s0 = s1;
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  s1 = peg$parseop_lessereq();
                  if (s1 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$f17();
                  }
                  s0 = s1;
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    s1 = peg$parseop_greater();
                    if (s1 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$f18();
                    }
                    s0 = s1;
                    if (s0 === peg$FAILED) {
                      s0 = peg$currPos;
                      s1 = peg$parseop_lesser();
                      if (s1 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$f19();
                      }
                      s0 = s1;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parseop_equals() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 61) {
      s0 = peg$c9;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e9); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 6) === peg$c10) {
        s0 = peg$c10;
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e10); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c11) {
          s0 = peg$c11;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e11); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c12) {
            s0 = peg$c12;
            peg$currPos += 2;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e12); }
          }
        }
      }
    }

    return s0;
  }

  function peg$parseop_notequals() {
    var s0;

    if (input.substr(peg$currPos, 2) === peg$c13) {
      s0 = peg$c13;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e13); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 9) === peg$c14) {
        s0 = peg$c14;
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e14); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 9) === peg$c15) {
          s0 = peg$c15;
          peg$currPos += 9;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e15); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c16) {
            s0 = peg$c16;
            peg$currPos += 5;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e16); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 5) === peg$c17) {
              s0 = peg$c17;
              peg$currPos += 5;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$e17); }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parseop_matchend() {
    var s0;

    if (input.substr(peg$currPos, 2) === peg$c18) {
      s0 = peg$c18;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e18); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 8) === peg$c19) {
        s0 = peg$c19;
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e19); }
      }
    }

    return s0;
  }

  function peg$parseop_regexmatch() {
    var s0;

    if (input.substr(peg$currPos, 2) === peg$c20) {
      s0 = peg$c20;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e20); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 9) === peg$c21) {
        s0 = peg$c21;
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e21); }
      }
    }

    return s0;
  }

  function peg$parseop_matchespath() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 126) {
      s0 = peg$c22;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e22); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 11) === peg$c23) {
        s0 = peg$c23;
        peg$currPos += 11;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e23); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 8) === peg$c24) {
          s0 = peg$c24;
          peg$currPos += 8;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e24); }
        }
      }
    }

    return s0;
  }

  function peg$parseop_greatereq() {
    var s0;

    if (input.substr(peg$currPos, 2) === peg$c25) {
      s0 = peg$c25;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e25); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 19) === peg$c26) {
        s0 = peg$c26;
        peg$currPos += 19;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e26); }
      }
    }

    return s0;
  }

  function peg$parseop_lessereq() {
    var s0;

    if (input.substr(peg$currPos, 2) === peg$c27) {
      s0 = peg$c27;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e27); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 18) === peg$c28) {
        s0 = peg$c28;
        peg$currPos += 18;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e28); }
      }
    }

    return s0;
  }

  function peg$parseop_greater() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 62) {
      s0 = peg$c29;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e29); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 11) === peg$c30) {
        s0 = peg$c30;
        peg$currPos += 11;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e30); }
      }
    }

    return s0;
  }

  function peg$parseop_lesser() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 60) {
      s0 = peg$c31;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e31); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 10) === peg$c32) {
        s0 = peg$c32;
        peg$currPos += 10;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e32); }
      }
    }

    return s0;
  }

  function peg$parseop_startswith() {
    var s0;

    if (input.substr(peg$currPos, 2) === peg$c33) {
      s0 = peg$c33;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e33); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 10) === peg$c34) {
        s0 = peg$c34;
        peg$currPos += 10;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e34); }
      }
    }

    return s0;
  }

  function peg$parsetoken() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = [];
    if (peg$r0.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e35); }
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        if (peg$r0.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e35); }
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f20(s1);
    }
    s0 = s1;

    return s0;
  }

  function peg$parsevalue() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 34) {
      s1 = peg$c35;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e36); }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      if (peg$r1.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e37); }
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        if (peg$r1.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e37); }
        }
      }
      if (input.charCodeAt(peg$currPos) === 34) {
        s3 = peg$c35;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e36); }
      }
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f21(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c36) {
        s1 = peg$c36;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e38); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f22();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 5) === peg$c37) {
          s1 = peg$c37;
          peg$currPos += 5;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e39); }
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$f23();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 4) === peg$c38) {
            s1 = peg$c38;
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e40); }
          }
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f24();
          }
          s0 = s1;
        }
      }
    }

    return s0;
  }

  function peg$parsews() {
    var s0;

    if (peg$r2.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e41); }
    }

    return s0;
  }

  peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}

module.exports = {
  SyntaxError: peg$SyntaxError,
  parse: peg$parse
};