import { defineConfig } from 'eslint/config';
import sharedNext from '@matrix-lib/eslint-config/next';

export default defineConfig([
  ...sharedNext,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react/no-unescaped-entities': 'off',
      'prefer-const': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'react/jsx-no-comment-textnodes': 'off',
      'no-var': 'off',
      'react/no-direct-mutation-state': 'off',
      'react-hooks/preserve-manual-memoization': 'off'
    }
  }
]);
