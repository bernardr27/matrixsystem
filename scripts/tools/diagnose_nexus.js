#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');
const path = require('node:path');

console.warn('[DEPRECATED] diagnose_nexus.js now delegates to diagnostics_core.cjs');

const target = path.join(__dirname, 'diagnostics_core.cjs');
execFileSync(process.execPath, [target, 'heartbeat', '--limit=50'], { stdio: 'inherit' });
