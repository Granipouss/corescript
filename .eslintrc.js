module.exports = {
    "ignorePatterns": ["js/libs/*.js"],
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "rules": {
        "no-control-regex": "off",
        "no-prototype-builtins": "off",
        "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        "no-undef": "off"
    }
}
