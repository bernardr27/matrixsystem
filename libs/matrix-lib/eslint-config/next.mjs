import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const nextConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    '.turbo/**',
    'out/**',
    'build/**',
    'dist/**',
    'next-env.d.ts'
  ])
]);

export default nextConfig;
