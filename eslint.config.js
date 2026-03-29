module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        __dirname: "readonly",
        __filename: "readonly",
        fetch: "readonly",
        require: "readonly",
        module: "readonly",
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-var": "error",
      "prefer-const": "error",
      "no-const-assign": "warn",
      "no-this-before-super": "warn",
      "no-undef": "warn",
      "no-unreachable": "warn",
      "constructor-super": "warn",
      "valid-typeof": "warn",
    },
    ignores: ["lib/package/plugins/BN004-unusedVariables.js"],
  },

  {
    files: ["test/specs/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        before: "readonly",
        after: "readonly",
        configuration: "readonly",
      },
    },
    rules: {},
  },
];
