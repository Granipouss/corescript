module.exports = {
    "ignorePatterns": ["js/libs/*.js"],
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
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
        "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
}
