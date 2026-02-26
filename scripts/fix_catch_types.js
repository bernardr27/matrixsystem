/**
 * Fix ALL remaining err.message / error.message / e.message on catch(: unknown) blocks.
 * This script does a simple global replacement of varname.message patterns
 * within catch blocks that use `: unknown`.
 */
const fs = require('fs');
const path = require('path');

const DIRS = [
    'g:/matrix/apps/reflect/src',
    'g:/matrix/apps/rocket-command/src',
    'g:/matrix/apps/nexus/src',
];

const IGNORE = ['node_modules', '.next', 'dist', '__tests__'];

function walk(dir, cb) {
    for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory() && !IGNORE.includes(entry)) {
            walk(full, cb);
        } else if (/\.(ts|tsx)$/.test(entry)) {
            cb(full);
        }
    }
}

let totalFixed = 0;

for (const dir of DIRS) {
    walk(dir, (filePath) => {
        let content = fs.readFileSync(filePath, 'utf8');
        const original = content;

        // Find catch blocks with `: unknown` and replace ALL property accesses
        // Strategy: find each catch clause, then within its scope replace .message access
        const catchPattern = /catch\s*\((\w+):\s*unknown\)\s*\{/g;
        let m;
        const varNames = new Set();
        while ((m = catchPattern.exec(content)) !== null) {
            varNames.add(m[1]);
        }

        for (const v of varNames) {
            // Replace v.message (not already wrapped in instanceof)
            const msgPat = new RegExp(`(?<!instanceof Error \\? )\\b${v}\\.message\\b`, 'g');
            content = content.replace(msgPat, `(${v} instanceof Error ? ${v}.message : String(${v}))`);

            // Replace v?.message  
            const optMsgPat = new RegExp(`\\b${v}\\?\\.\\s*message\\b`, 'g');
            content = content.replace(optMsgPat, `(${v} instanceof Error ? ${v}.message : String(${v}))`);
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            totalFixed++;
            console.log('Fixed:', path.relative('g:/matrix', filePath));
        }
    });
}

console.log(`\nTotal files fixed: ${totalFixed}`);
