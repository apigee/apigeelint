
const debug = require("debug")("apigeelint:template");

const STATES = {
        OUTSIDE_CURLY: 0,
        INSIDE_CURLY_NO_TEXT: 1,
        INSIDE_CURLY: 2,
        INSIDE_VARREF: 3,
        INSIDE_FUNCTION_NO_TEXT: 4,
        INSIDE_FUNCTION: 5
      };

const UPPER_A = 65,
      UPPER_Z = 90,
      LOWER_a = 97,
      LOWER_z = 122;

const stateToString = s =>
        Object.keys(STATES).find( key => STATES[key] == s);


const isValidTemplate = (expr) => {
        let state = STATES.OUTSIDE_CURLY;
        const states = [];
        let code;
        try {
          for (const ch of expr) {
            debug(`state(${stateToString(state)}) ch(${ch})`);
            switch (state) {
            case STATES.OUTSIDE_CURLY:
            case STATES.INSIDE_CURLY:
              if (ch == '{') {
                states.push(state);
                state = STATES.INSIDE_CURLY_NO_TEXT;
              }
              if (ch == '}') {
                if (state == STATES.OUTSIDE_CURLY) {
                  return false;
                }
                state = states.pop();
              }
              break;

            case STATES.INSIDE_CURLY_NO_TEXT:
              if (ch == '}' || ch == '{' || ch == '[' || ch == '(') {
                return false;
              }
              code = ch.charCodeAt(0);
              if (!(code >= UPPER_A && code <= UPPER_Z) &&
                !(code >=  LOWER_a && code <= LOWER_z)) {
                state = STATES.INSIDE_CURLY;
              }
              else {
                state = STATES.INSIDE_VARREF;
              }
              break;

            case STATES.INSIDE_VARREF:
              if (ch == '{' || ch == '[' || ch == ')') {
                return false;
              }
              if (ch == '(') {
                state = STATES.INSIDE_FUNCTION_NO_TEXT;
              }
              if (ch == '}') {
                state = states.pop();
              }
              break;

            case STATES.INSIDE_FUNCTION_NO_TEXT:
              if (ch == '{' || ch == '[' || ch == '(' || ch == ')' || ch == '}' || ch == ']') {
                return false;
              }
              state = STATES.INSIDE_FUNCTION;
              break;

            case STATES.INSIDE_FUNCTION:
              if (ch == '{' || ch == '[' || ch == '(') {
                return false;
              }
              if (ch == ')') {
                state = STATES.AWAITING_CLOSE_CURLY;
              }
              break;

            case STATES.AWAITING_CLOSE_CURLY:
              if (ch != '}') {
                return false;
              }
              state = states.pop();
              break;

            default:
              // should not happen
              debug(`unknown state (${state})`);
              return false;
            }
          }
        } catch(e) {
          // stack underflow
          debug(`stack underflow? exception (${e})`);
          return false;
        }
        debug(`final state(${stateToString(state)})`);
        return state == STATES.OUTSIDE_CURLY;
      };

const isValidPropertySetRef = (expr) => {
        if ( ! isValidTemplate(expr)) {
          return false;
        }
        if (expr.includes('{')) {
          // There is a variable reference.
          // Simulate a variable substitution; the result must have AT MOST one dot.
          const r = new RegExp('{[^}]+}', 'g'),
                result = expr.replaceAll(r, 'xxx');
          return (result.match(/\./g) || []).length <= 1;
        }
        // No variable reference; the expression must have exactly one dot.
        return (expr.match(/\./g) || []).length == 1;
      };

module.exports = {
  isValidTemplate,
  isValidPropertySetRef
};
