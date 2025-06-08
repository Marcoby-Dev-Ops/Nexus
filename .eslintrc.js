module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    // Consistency rules to prevent regression
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/bg-(blue|red|green|yellow|purple|indigo|gray)-\\d+/]',
        message: 'Use design tokens instead of hardcoded colors (e.g., bg-primary, bg-secondary)'
      },
      {
        selector: 'Literal[value=/text-(blue|red|green|yellow|purple|indigo|gray)-\\d+/]',
        message: 'Use design tokens instead of hardcoded text colors (e.g., text-foreground, text-muted-foreground)'
      },
      {
        selector: 'Literal[value=/border-2 border-current border-t-transparent rounded-full animate-spin/]',
        message: 'Use the standardized <Spinner> component instead of custom spinner styles'
      }
    ],
    // React specific rules
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  env: {
    browser: true,
    es2021: true,
    node: true
  }
}; 