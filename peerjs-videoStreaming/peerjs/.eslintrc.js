module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    parserOptions: {
      ecmaVersion: 2020, // or the version you need
      sourceType: 'module',
    },
    rules: {
      'no-console': 'off', // Equivalent to tslint's "no-console": false
      '@typescript-eslint/no-shadow': 'off', // Equivalent to tslint's "no-shadowed-variable": false
    },
  };
  