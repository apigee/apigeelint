const debug = require("debug")("apigeelint:template");

const STATES = {
  UNDEFINED: -1,
  OUTSIDE_CURLY: 0,
  INSIDE_CURLY_NO_TEXT: 1,
  INSIDE_CURLY: 2,
  INSIDE_VARREF: 3,
  INSIDE_FNARGS_NO_TEXT: 4,
  INSIDE_FNARGS: 5,
};

const CODES = {
  UPPER_A: 65,
  UPPER_Z: 90,
  LOWER_a: 97,
  LOWER_z: 122,
  ZERO: 48,
  NINE: 57,
};

const ZERO_ARG_FUNCTIONS = ["createUuid", "randomLong"];

const FUNCTION_NAMES = [
  "sha1Hex",
  "sha1Base64",
  "sha256Hex",
  "sha256Base64",
  "sha384Hex",
  "sha384Base64",
  "sha512Hex",
  "sha512Base64",
  "md5Hex",
  "md5Base64",
  "xPath",
  "xpath",
  "jsonPath",
  "substring",
  "firstnonnull",
  "replaceAll",
  "replaceFirst",
  "createUuid",
  "randomLong",
  "hmacMd5",
  "hmacSha1",
  "hmacSha224",
  "hmacSha256",
  "hmacSha384",
  "hmacSha512",
  "timeFormat",
  "timeFormatMs",
  "timeFormatUTC",
  "timeFormatUTCMs",
  "xeger",
  "encodeHTML",
  "escapeJSON",
  "escapeXML",
  "escapeXML11",
  "toUpperCase",
  "toLowerCase",
  "encodeBase64",
  "decodeBase64",
];

const validateFunction = (expr, start, end) => {
  const fn = expr.substring(start, end);
  if (FUNCTION_NAMES.find((f) => fn == f)) {
    return { fn };
  }
  return { fn, error: "unknown function" };
};

const validateFunctionArgs = (expr, fnStart, argsStart, end) => {
  const fn = expr.substring(fnStart, argsStart - 1);
  const argsString = expr.substring(argsStart, end);
  // if (argsString.includes(' ')) {
  //   return {fn, error: 'spaces in argument string'};
  // }
  if (argsString != "" && argsString.trim() == "") {
    return { fn, error: "spaces between parens" };
  }
  if (argsString == "" && !ZERO_ARG_FUNCTIONS.includes(fn)) {
    return { fn, error: `empty arg string` };
  }
  return { fn };
};

const stateToString = (s) =>
  Object.keys(STATES).find((key) => STATES[key] == s);

/*
 * returns undefined for valid template. Returns an explanatory string if invalid.
 **/
const validateTemplate = (expr) => {
  let state = STATES.OUTSIDE_CURLY;
  const states = [];
  let code,
    fnStart = -1,
    argsStart = -1;
  let ix = -1;
  try {
    for (const ch of expr) {
      ix++;
      debug(`state(${stateToString(state)}) ch(${ch})`);
      switch (state) {
        case STATES.OUTSIDE_CURLY:
        case STATES.INSIDE_CURLY:
          if (ch == "{") {
            states.push(state);
            state = STATES.INSIDE_CURLY_NO_TEXT;
            fnStart = ix;
          }
          if (ch == "}") {
            if (state == STATES.OUTSIDE_CURLY) {
              return `unexpected close curly at position ${ix}`;
            }
            state = states.pop();
          }
          break;

        case STATES.INSIDE_CURLY_NO_TEXT:
          if (ch == "}") {
            return `empty function name at position ${ix}`;
          }
          if (ch == "{" || ch == "[" || ch == "(") {
            return `unexpected character at position ${ix}: ${ch}`;
          }
          code = ch.charCodeAt(0);
          // examine first character. A numeric is invalid.
          if (code >= CODES.ZERO && code <= CODES.NINE) {
            return `unexpected character at position ${ix}: ${ch}`;
          }
          // a non-alphabetic means it's not a variable or function.
          else if (
            !(code >= CODES.UPPER_A && code <= CODES.UPPER_Z) &&
            !(code >= CODES.LOWER_a && code <= CODES.LOWER_z)
          ) {
            state = STATES.INSIDE_CURLY;
          } else {
            state = STATES.INSIDE_VARREF;
          }
          break;

        case STATES.INSIDE_VARREF:
          if (ch == "{" || ch == "[" || ch == ")") {
            return `unexpected character at position ${ix}: ${ch}`;
          }
          if (ch == "(") {
            const r = validateFunction(expr, fnStart + 1, ix);
            if (r.error) {
              return `unsupported function name (${r.fn})`;
            }
            argsStart = ix;
            state = STATES.INSIDE_FNARGS_NO_TEXT;
          }
          if (ch == "}") {
            state = states.pop();
          }
          break;

        case STATES.INSIDE_FNARGS_NO_TEXT:
          if (ch == "{" || ch == "[" || ch == "(" || ch == "}" || ch == "]") {
            return `unexpected character at position ${ix}: ${ch}`;
          }
          if (ch == ")") {
            const r = validateFunctionArgs(
              expr,
              fnStart + 1,
              argsStart + 1,
              ix,
            );
            if (r.error) {
              return `${r.error} for function ${r.fn}`;
            }
            state = STATES.AWAITING_CLOSE_CURLY;
          } else {
            state = STATES.INSIDE_FNARGS;
          }
          break;

        case STATES.INSIDE_FNARGS:
          if (ch == "{" || ch == "[" || ch == "(") {
            return `unexpected character at position ${ix}: ${ch}`;
          }
          if (ch == ")") {
            const r = validateFunctionArgs(
              expr,
              fnStart + 1,
              argsStart + 1,
              ix,
            );
            if (r.error) {
              return `${r.error} for function ${r.fn}`;
            }
            state = STATES.AWAITING_CLOSE_CURLY;
          }
          break;

        case STATES.AWAITING_CLOSE_CURLY:
          if (ch != "}") {
            return `unexpected character at position ${ix}: ${ch}`;
          }
          state = states.pop();
          break;

        default:
          // should not happen
          debug(`unknown state (${state})`);
          return "parse faillure";
      }
    }
  } catch (e) {
    // stack underflow
    debug(`stack underflow? exception (${e})`);
    return "extraneous close-brace at position ${ix}";
  }
  debug(`final state(${stateToString(state)})`);
  return state == STATES.OUTSIDE_CURLY ? undefined : "unterminated curly brace";
};

const validatePropertySetRef = (expr) => {
  let r = validateTemplate(expr);
  if (r) {
    return r;
  }
  if (expr.includes("{")) {
    // There is a variable reference.
    // Simulate a variable substitution; the result must have at most one dot.
    const re = new RegExp("{[^}]+}", "g"),
      result = expr.replaceAll(re, "xxx");
    return (result.match(/\./g) || []).length > 1
      ? "there is more than one dot in the template result"
      : undefined;
  }
  // No variable reference; the expression must have exactly one dot.
  r = (expr.match(/\./g) || []).length;
  return r == 1
    ? undefined
    : `there are ${r} dots ( !=1 ) in the template result`;
};

module.exports = {
  validateTemplate,
  validatePropertySetRef,
};
