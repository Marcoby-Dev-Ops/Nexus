// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.es2021,
      ...globals.node,
      ...globals.jest,
    },
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
    'jsx-a11y': jsxA11y,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    ...jsxA11y.configs.recommended.rules,
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', disallowTypeAnnotations: false }
    ],
    'jsx-a11y/label-has-associated-control': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/heading-has-content': 'warn',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    'jsx-a11y/no-noninteractive-tabindex': 'warn',
    'jsx-a11y/role-supports-aria-props': 'warn',
    'prefer-const': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',
    'no-var': 'error',
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-case-declarations': 'warn',
    'no-useless-catch': 'warn',
    'no-empty': 'warn',
    'no-useless-escape': 'warn',
    'no-constant-condition': 'warn',
    'no-dupe-else-if': 'warn',
    '@typescript-eslint/no-require-imports': 'warn',
    '@typescript-eslint/no-empty-object-type': 'warn',
    '@typescript-eslint/no-unused-expressions': 'warn',
    '@typescript-eslint/triple-slash-reference': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'react-hooks/rules-of-hooks': 'warn',

    // Database Access Pattern Enforcement
    'no-restricted-imports': [
      'warn',
      {
        patterns: [
          {
            group: ['@/lib/supabase'],
            message: 'Use api-client for components, this.database for services. See server/docs/DATABASE_ACCESS_PATTERNS.md'
          }
        ]
      }
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}, // Database Access Pattern Enforcement for different file types
{
  files: ['src/**/*.tsx', 'src/**/*.ts'],
  rules: {
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/no-autofocus': 'warn',
    'no-restricted-imports': [
      'warn',
      {
        patterns: [
          {
            group: ['@/lib/supabase'],
            message: 'Use api-client for components, this.database for services. See server/docs/DATABASE_ACCESS_PATTERNS.md'
          }
        ]
      }
    ],
  },
}, // Service files - enforce this.database usage (temporarily disabled)
{
  files: ['src/**/services/**/*.ts', 'src/**/core/services/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'warn',
      {
        patterns: [
          {
            group: ['@/lib/supabase'],
            message: 'Services must use this.database or this.postgres, not direct Supabase imports'
          },
          {
            group: ['@/lib/api-client'],
            message: 'Services must use this.database or this.postgres, not api-client'
          }
        ]
      }
    ],
  },
}, // Component files - enforce api-client usage
{
  files: ['src/**/*.tsx', 'src/**/hooks/**/*.ts', 'src/**/pages/**/*.tsx'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/lib/supabase'],
            message: 'Components must use api-client, not direct Supabase imports'
          }
        ]
      }
    ],
  },
}, {
  ignores: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.vite/**',
    'coverage/**',
    'cypress/videos/**',
    'cypress/screenshots/**',
    '*.config.js',
    '*.config.ts',
    'vite.config.ts',
    'tailwind.config.ts',
    'postcss.config.cjs',
    'jest.config.cjs',
    'jest.setup.cjs',
    'jest.transformer.cjs',
    'scripts/**',

    'docs/**',
    'archive/**',
    'backups/**',
    'public/**',
  'src/stories/**',
    '__tests__/**',
    '*.test.ts',
    '*.test.tsx',
    '*.spec.ts',
    '*.spec.tsx',
  ],
}, storybook.configs["flat/recommended"]); 
