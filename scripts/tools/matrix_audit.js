#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');
const path = require('node:path');

console.warn('[DEPRECATED] scripts/tools/matrix_audit.js moved to scripts/archive/legacy-tools/matrix_audit.js');
console.warn('[DEPRECATED] Use: npm run cloud:preflight or npm run diag:bridge');

const target = path.join(__dirname, 'diagnostics_core.cjs');
execFileSync(process.execPath, [target, 'bridge-audit', '--limit=50'], { stdio: 'inherit' });
