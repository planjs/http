module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['standard', 'prettier/@typescript-eslint', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  env: {
    browser: true,
    node: true,
  },
};
