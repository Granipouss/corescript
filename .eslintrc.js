module.exports = {
    "ignorePatterns": ["js/libs/*.js"],
    "env": {
        "browser": true,
        "es2021": true
    },
    "plugins": [
      "@typescript-eslint"
    ],
    "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "globals": {
        "global": true
    },
    "rules": {
        "no-control-regex": "off",
        "no-prototype-builtins": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
}
