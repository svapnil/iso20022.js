import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { Linter } from 'eslint';

const config: Linter.Config[] = [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-debugger': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];

export default config;
