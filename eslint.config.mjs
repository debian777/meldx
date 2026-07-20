import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'out-test/**',
      'node_modules/**',
      '**/*.vsix',
      'esbuild.js',
      'vitest.config.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-properties': [
        'warn',
        { object: 'fs', property: 'readFileSync', message: 'Avoid sync FS on hot paths; use async APIs.' },
        { object: 'fs', property: 'readdirSync', message: 'Avoid sync FS on hot paths; use async APIs.' },
        { object: 'fs', property: 'statSync', message: 'Avoid sync FS on hot paths; use async APIs.' },
      ],
    },
  },
);
