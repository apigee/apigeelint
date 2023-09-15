
const STATES = {
        OUTSIDE_CURLY: 0,
        INSIDE_CURLY_NO_TEXT: 1,
        INSIDE_CURLY: 2,
        INSIDE_FUNCTION_NO_TEXT: 3,
        INSIDE_FUNCTION: 4
      };

const isValidTemplate = (expr) => {
        let state = STATES.OUTSIDE_CURLY;
        for (const ch of expr) {
          switch (state) {
          case STATES.OUTSIDE_CURLY:
            if (ch == '{') {
              state = STATES.INSIDE_CURLY_NO_TEXT;
            }
            if (ch == '}') {
              return false;
            }
            break;

          case STATES.INSIDE_CURLY_NO_TEXT:
            if (ch == '}' || ch == '{' || ch == '[' || ch == '(') {
              return false;
            }
            state = STATES.INSIDE_CURLY;
            break;

          case STATES.INSIDE_CURLY:
            if (ch == '{' || ch == '[' || ch == ')') {
              return false;
            }
            if (ch == '(') {
              state = STATES.INSIDE_FUNCTION_NO_TEXT;
            }
            if (ch == '}') {
              state = STATES.OUTSIDE_CURLY;
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
            state = STATES.OUTSIDE_CURLY;
            break;

          default:
            // should not happen
            return false;
          }
        }
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
