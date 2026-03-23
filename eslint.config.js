module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
    },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-var": "error",
      "prefer-const": "error",
    },
    ignores: ["lib/package/plugins/BN004-unusedVariables.js"],
  },
];
