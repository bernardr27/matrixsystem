#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const DIAG = path.join(ROOT, 'docs', 'diagnostics');
const ARCHIVE = path.join(ROOT, 'docs', 'archive', 'diagnostics');
const DAYS = Number(process.argv.find((a) => a.startsWith('--days='))?.split('=')[1] || 14);
const DRY = process.argv.includes('--dry-run');

function main() {
    if (!fs.existsSync(DIAG)) {
        console.log('[artifact_hygiene] diagnostics dir not found');
        return;
    }
    fs.mkdirSync(ARCHIVE, { recursive: true });
    const cutoff = Date.now() - DAYS * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(DIAG).filter((f) => /\.(json|md)$/i.test(f));
    let moved = 0;

    for (const file of files) {
        const src = path.join(DIAG, file);
        const st = fs.statSync(src);
        if (st.mtimeMs >= cutoff) continue;
        const dst = path.join(ARCHIVE, file);
        if (DRY) {
            console.log(`[artifact_hygiene] would_move ${path.relative(ROOT, src)} -> ${path.relative(ROOT, dst)}`);
        } else {
            fs.renameSync(src, dst);
            moved += 1;
        }
    }

    if (!DRY) console.log(`[artifact_hygiene] moved=${moved} older_than_days=${DAYS}`);
}

main();
