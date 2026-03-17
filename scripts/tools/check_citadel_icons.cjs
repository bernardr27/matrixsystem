#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const ICON_DIR = path.join(ROOT, 'apps', 'citadel', 'public', 'icons');
const ROUTE_FILE = path.join(ROOT, 'apps', 'citadel', 'src', 'app', 'api', 'apps', 'route.ts');
const MAX_BYTES = 250 * 1024;
const REQUIRED_DIM = 256;

function readPngSize(buf) {
  // PNG IHDR chunk stores width/height at bytes 16..23
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function main() {
  const problems = [];
  const files = fs.readdirSync(ICON_DIR).filter((f) => f.endsWith('-v2.png'));
  if (!files.length) {
    problems.push('No *-v2.png icons found in Citadel icons directory');
  }

  for (const file of files) {
    const full = path.join(ICON_DIR, file);
    const buf = fs.readFileSync(full);
    const dim = readPngSize(buf);
    if (!dim) {
      problems.push(`${file}: invalid PNG`);
      continue;
    }
    if (dim.width !== REQUIRED_DIM || dim.height !== REQUIRED_DIM) {
      problems.push(`${file}: dimensions ${dim.width}x${dim.height}, expected ${REQUIRED_DIM}x${REQUIRED_DIM}`);
    }
    if (buf.length > MAX_BYTES) {
      problems.push(`${file}: size ${Math.round(buf.length / 1024)}KB exceeds ${Math.round(MAX_BYTES / 1024)}KB`);
    }
  }

  const route = fs.readFileSync(ROUTE_FILE, 'utf8');
  const refs = [...route.matchAll(/image:\s*'([^']+)'/g)].map((m) => m[1]);
  for (const ref of refs) {
    const full = path.join(ROOT, 'apps', 'citadel', 'public', ref.replace(/^\//, ''));
    if (!fs.existsSync(full)) problems.push(`Missing icon referenced in route.ts: ${ref}`);
  }

  if (problems.length) {
    console.error('[icon_guard] FAILED');
    for (const p of problems) console.error(` - ${p}`);
    process.exit(2);
  }

  console.log(`[icon_guard] OK files=${files.length} dim=${REQUIRED_DIM} max_kb=${Math.round(MAX_BYTES / 1024)} refs=${refs.length}`);
}

main();
