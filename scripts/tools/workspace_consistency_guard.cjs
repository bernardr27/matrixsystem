#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const pkgPath = path.join(ROOT, 'package.json');

function main() {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const scripts = pkg.scripts || {};
  const text = JSON.stringify(scripts);
  const missing = [];
  if (!text.includes('--workspace rocket-command-pro')) {
    missing.push('canonical_workspace_reference');
  }

  if (missing.length) {
    console.error('[workspace_guard] FAILED');
    for (const m of missing) console.error(` - missing: ${m}`);
    process.exit(2);
  }

  console.log('[workspace_guard] OK canonical=rocket-command-pro');
}

main();
