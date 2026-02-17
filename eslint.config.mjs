import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['.wxt/', '.output/', 'node_modules/', 'tools/'],
  },

  // Base: ESLint recommended
  js.configs.recommended,

  // TypeScript: recommended rules
  ...tseslint.configs.recommended,

  // TypeScript parser options
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React
  {
    files: ['**/*.{tsx,jsx}'],
    ...react.configs.flat.recommended,
    ...react.configs.flat['jsx-runtime'],
    settings: {
      react: { version: 'detect' },
    },
  },

  // React Hooks
  {
    files: ['**/*.{tsx,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Source files: browser globals
  {
    files: ['entrypoints/**/*.{ts,tsx}', 'utils/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  // Config files: Node globals
  {
    files: ['wxt.config.ts', 'eslint.config.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Project-specific rule overrides
  {
    plugins: { '@stylistic': stylistic },
    rules: {
      // WXT auto-imports globals (browser, defineBackground, etc.) via ambient .d.ts
      // TypeScript handles undef checking, so disable ESLint's version
      'no-undef': 'off',

      // Allow unused vars prefixed with _
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Code block formatting
      '@stylistic/padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: '*', next: ['if', 'for', 'while', 'switch', 'try'] },
        { blankLine: 'always', prev: ['if', 'for', 'while', 'switch', 'try'], next: '*' },
      ],
    },
  },

  // Prettier compat (must be last)
  eslintConfigPrettier,
);
