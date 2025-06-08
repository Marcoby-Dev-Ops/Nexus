import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
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
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn'
    },
  },
); 