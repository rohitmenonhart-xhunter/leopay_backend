module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    jest: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { 
      argsIgnorePattern: 'next|req|res' 
    }],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single']
  }
}; 