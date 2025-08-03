module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [require.resolve('@typescript-eslint/eslint-plugin')],
  extends: [
    require.resolve('eslint:recommended'),
    require.resolve('@typescript-eslint/eslint-plugin/dist/configs/recommended'),
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: require.resolve('./tsconfig.json'),
  },
  env: {
    node: true,
    es6: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['packages/frontend/**/*.{ts,tsx}'],
      extends: ['next/core-web-vitals'],
      env: {
        browser: true,
      },
    },
  ],
};
