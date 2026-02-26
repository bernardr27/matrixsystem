import js from '@eslint/js';

const baseConfig = [
  js.configs.recommended,
  {
    ignores: [
      '.next/**',
      '.turbo/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**'
    ]
  }
];

export default baseConfig;
