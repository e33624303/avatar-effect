module.exports = {
  parserOptions: {
    ecmaVersion: 11,
  },
  env: {
    es2020: true,
    node: true,
    browser: true,
  },
  extends: ['airbnb/base', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error'],
  },
};
