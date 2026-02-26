const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const APPS_DIR = path.join(ROOT, 'apps');
const OUT = path.join(ROOT, 'docs', 'API.md');

const appDirs = fs.readdirSync(APPS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => fs.existsSync(path.join(APPS_DIR, name, 'src')));

const routes = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/route\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) continue;

    const rel = full.replace(ROOT + path.sep, '').replace(/\\/g, '/');
    const app = rel.split('/')[1];
    const apiPath = rel
      .replace(/^apps\/[^/]+\/src\/app/, '')
      .replace(/\/route\.(ts|tsx|js|mjs|cjs)$/, '') || '/';

    routes.push({ app, apiPath, file: rel });
  }
}

for (const app of appDirs) {
  const srcDir = path.join(APPS_DIR, app, 'src', 'app');
  if (fs.existsSync(srcDir)) walk(srcDir);
}

routes.sort((a, b) => (a.app + a.apiPath).localeCompare(b.app + b.apiPath));

const lines = [];
lines.push('# Matrix API Inventory');
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push('');
lines.push('| App | Route | File |');
lines.push('|---|---|---|');
for (const r of routes) {
  lines.push(`| ${r.app} | \`${r.apiPath}\` | \`${r.file}\` |`);
}
lines.push('');
lines.push('## Notes');
lines.push('- This document is generated from `src/app/**/route.*` files.');
lines.push('- Regenerate with `npm run docs:api`.');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(JSON.stringify({ ok: true, routes: routes.length, out: OUT }, null, 2));
