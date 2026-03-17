#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');
const path = require('node:path');

console.warn('[DEPRECATED] scripts/tools/nexus_doctor.js moved to scripts/archive/legacy-tools/nexus_doctor.js');
console.warn('[DEPRECATED] Use: npm run ops:autopilot:quick');

const target = path.join(__dirname, 'ops_autopilot.cjs');
execFileSync(process.execPath, [target, '--quick'], { stdio: 'inherit' });
