import js from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import tanstackQuery from '@tanstack/eslint-plugin-query';
import { flatConfigs } from 'eslint-plugin-import-x';
import perfectionist from 'eslint-plugin-perfectionist';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import tailwind from 'eslint-plugin-tailwindcss';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '.next',
    'out',
    'build',
    'next-env.d.ts',
    'src/types/database.types.ts',
    'src/themes/*.js',
    'src/themes/*.d.ts',
  ]),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      flatConfigs.recommended,
      flatConfigs.typescript,
      ...tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
      nextPlugin.configs['core-web-vitals'],
      ...tanstackQuery.configs['flat/recommended'],
      tailwind.configs.recommended,
      prettier,
    ],

    settings: {
      'import-x/resolver': {
        typescript: true,
      },
      tailwindcss: {
        cssConfigPath: './src/app/globals.css',
        parseKeyFunctions: ['classnames', 'classNames'],
      },
    },

    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      react,
      'unused-imports': unusedImports,
      perfectionist,
      'check-file': checkFile,
    },

    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'import-x/no-unresolved': 'error',
      'import-x/no-cycle': 'error',
      'import-x/no-default-export': 'error',
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/features/devices',
              from: './src/features',
              except: ['./devices', './catalogs', './activity', './members'],
            },
            {
              target: './src/features/members',
              from: './src/features',
              except: ['./members'],
            },

            {
              target: './src/features',
              from: './src/app',
            },

            {
              target: [
                './src/components',
                './src/config',
                './src/hooks',
                './src/lib',
                './src/stores',
                './src/types',
                './src/utils',
              ],
              from: ['./src/features', './src/app'],
            },
          ],
        },
      ],

      'perfectionist/sort-imports': [
        'error',
        {
          ignoreCase: false,
          internalPattern: ['^@/.+'],
          groups: [
            ['react-value', 'next-value'],
            { newlinesBetween: 0 },
            ['react-type', 'next-type'],
            'value-builtin',
            { newlinesBetween: 0 },
            'type-builtin',
            'value-external',
            { newlinesBetween: 0 },
            'type-external',
            'value-internal',
            { newlinesBetween: 0 },
            'type-internal',
            ['value-parent', 'value-sibling', 'value-index'],
            ['type-parent', 'type-sibling', 'type-index'],
            'type-import',
            'ts-equals-import',
            'unknown',
          ],
          customGroups: [
            {
              groupName: 'react-value',
              modifiers: ['value'],
              elementNamePattern: '^react(-dom)?(/.*)?$',
            },
            {
              groupName: 'react-type',
              modifiers: ['type'],
              elementNamePattern: '^react(-dom)?(/.*)?$',
            },
            {
              groupName: 'next-value',
              modifiers: ['value'],
              elementNamePattern: '^next(/.*)?$',
            },
            {
              groupName: 'next-type',
              modifiers: ['type'],
              elementNamePattern: '^next(/.*)?$',
            },
          ],
        },
      ],
      'perfectionist/sort-named-imports': ['error', { ignoreCase: false }],
      'perfectionist/sort-exports': ['error', { ignoreCase: false }],
      'perfectionist/sort-named-exports': ['error', { ignoreCase: false }],

      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/consistent-type-imports': ['error'],
      '@typescript-eslint/consistent-type-exports': ['error'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { vars: 'all', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        { ignoreIfStatements: true, ignorePrimitives: true },
      ],
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],

      'react/jsx-key': 'error',
      'react/no-deprecated': 'error',
      'react/self-closing-comp': 'error',

      'check-file/filename-naming-convention': [
        'error',
        { 'src/**/*.{ts,tsx}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          '!(src/app)/**/*': 'KEBAB_CASE',
          '!(**/__tests__)/**/*': 'KEBAB_CASE',
        },
      ],

      'unused-imports/no-unused-imports': 'error',

      'tailwindcss/classnames-order': 'off',
    },
  },

  {
    files: [
      'src/app/**/{page,layout,loading,error,not-found,template,default,global-error}.tsx',
      'next.config.ts',
      'src/i18n/request.ts',
    ],
    rules: { 'import-x/no-default-export': 'off' },
  },

  // shadcn/ui primitives are generated by the CLI and vendored as-is; relax the
  // strictest type-aware/a11y rules for them so we don't hand-edit boilerplate.
  {
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/hooks/use-mobile.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'tailwindcss/no-custom-classname': 'off',
    },
  },
]);
