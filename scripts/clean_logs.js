/**
 * Batch script to remove or comment out console.log statements from production code paths
 * to create a cleaner terminal output, while keeping console.error and console.warn.
 * We'll specifically ignore test files and scripts.
 */
const fs = require('fs');
const path = require('path');

const DIRS = [
    'g:/matrix/apps/reflect/src',
    'g:/matrix/apps/rocket-command/src',
    'g:/matrix/apps/nexus/src',
    'g:/matrix/apps/citadel/src',
    'g:/matrix/apps/ghost-command/src'
];

const IGNORE = ['node_modules', '.next', 'dist', '__tests__', 'logger.ts', 'logger.cjs', 'logger.js'];

// We only want to comment out single-line console.log calls that don't span multiple lines
// to keep it simple and safe. More complex logs can be ignored or done manually.
const logPattern = /^(?!.*\/\/.*)(.*?)(\bconsole\.log\s*\([^;]*\);?)\s*$/gm;

function walk(dir, cb) {
    for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory() && !IGNORE.includes(entry)) {
            walk(full, cb);
        } else if (/\.(ts|tsx|js|cjs)$/.test(entry) && !IGNORE.includes(entry)) {
            cb(full);
        }
    }
}

let totalFixed = 0;

for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;

    walk(dir, (filePath) => {
        let content = fs.readFileSync(filePath, 'utf8');
        const original = content;

        content = content.replace(logPattern, (match, before, func) => {
            // Don't comment out if it's already inside a comment or string
            if (before.includes('//') || before.includes('/*')) return match;
            return `${before}// ${func}`;
        });

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            totalFixed++;
            console.log('Fixed:', path.relative('g:/matrix', filePath));
        }
    });
}

console.log(`\nTotal files cleaned up: ${totalFixed}`);
