module.exports = {
  root: false,
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:unicorn/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['react', 'security', 'no-unsanitized'],
  rules: {
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-unsafe-regex': 'warn',
    'no-unsanitized/method': 'error',
    'no-unsanitized/property': 'error',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/prefer-event-target': 'off'
  }
};
