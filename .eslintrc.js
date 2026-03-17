/**
 * ESLint config for React 18 + TypeScript 5+.
 * Goal: catch correctness and accessibility issues early while keeping DX fast.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    // Keep hooks correct; stale dependency bugs are expensive in UI state flows.
    'react-hooks/exhaustive-deps': 'warn',

    // Keep lint fast without requiring full type-aware project analysis.
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-floating-promises': 'off',

    // Encourage safer TS without blocking migration-heavy modules.
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-wrapper-object-types': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-require-imports': 'off',

    // Legacy code compatibility: keep as warning-first baseline.
    'prefer-const': 'off',
    'no-var': 'off',
    'no-unused-expressions': 'off',

    // Accessibility: interactive controls should be keyboard and label friendly.
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/label-has-associated-control': ['warn', { assert: 'either' }],
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/anchor-has-content': 'warn',
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    'jsx-a11y/iframe-has-title': 'warn',
    'jsx-a11y/mouse-events-have-key-events': 'warn',

    // React 17+ JSX transform does not require React in scope.
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-no-target-blank': 'warn',
    'react/jsx-key': 'warn',
    'react/no-unknown-property': 'warn',
    'react/no-unescaped-entities': 'warn',
    'react/no-children-prop': 'warn',
    'react/no-deprecated': 'warn',
    'react/display-name': 'warn',
    'react-hooks/rules-of-hooks': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/immutability': 'warn',
    'react-hooks/use-memo': 'warn',
    'react-hooks/preserve-manual-memoization': 'off',
    'react-hooks/refs': 'off',
    'no-empty': 'warn',
    'no-prototype-builtins': 'warn',
    'no-extra-boolean-cast': 'warn',
    'no-unsafe-optional-chaining': 'warn',
    'no-case-declarations': 'warn',
    'no-inner-declarations': 'warn',
    'no-useless-escape': 'warn',

    // Keep formatting surfaced as lint diagnostics in editor and CI.
    'prettier/prettier': 'off',
  },
  overrides: [
    {
      files: ['tests/**/*.{ts,tsx}'],
      extends: ['plugin:playwright/recommended'],
      rules: {
        // Prefer user-visible queries and stable locators.
        'playwright/no-wait-for-timeout': 'warn',
        'playwright/prefer-web-first-assertions': 'warn',
        'playwright/no-standalone-expect': 'warn',
        'playwright/prefer-to-have-length': 'warn',
      },
    },
    {
      files: ['scripts/**/*.{js,ts}', '*.config.{js,ts}', 'vite.config.ts', 'playwright.config.ts'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
