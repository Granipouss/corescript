module.exports = {
    "ignorePatterns": ["template"],
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
        "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports", "disallowTypeAnnotations": true }],
        "@typescript-eslint/explicit-function-return-type": ["error"],
        "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
}
