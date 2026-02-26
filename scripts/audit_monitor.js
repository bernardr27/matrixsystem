/**
 * Nexus Audit Monitor v1.0
 * Purpose: Automated scanning of application components and page states to ensure 
 * Golden State compliance. Includes a Safe-Fail mechanism for certification.
 */

const fs = require('fs');
const path = require('path');

const SCAN_TARGETS = [
    'apps/nexus/src/app/page.tsx',
    'apps/nexus/src/app/analytics/page.tsx',
    'apps/nexus/src/app/knowledge/page.tsx',
    'apps/nexus/src/components/ui/NexusShell.tsx'
];

const AUDIT_RULES = [
    { name: 'Cutoff Text', pattern: /truncate|line-clamp/g, warning: 'Potential text cutoff detected' },
    { name: 'Empty States', pattern: /\.length\s*>\s*0|\.length\s*!==\s*0/g, inverse: true, warning: 'Missing explicit array length check for rendering' },
    { name: 'Z-Index Conflicts', pattern: /z-\[([1-9]|[1-9]\d|[1-2]\d{2})\]/g, warning: 'Low-range hardcoded z-index detected (conflict risk)' },
    { name: 'Hardcoded Colors', pattern: /text-(red|blue|green)-500/g, warning: 'Non-standard color used' }
];

async function runAudit() {
    console.log('--- NEXUS AUDIT SYSTEM STARTING ---');
    let issuesFound = 0;

    for (const target of SCAN_TARGETS) {
        const fullPath = path.resolve('G:/matrix', target);
        console.log(`\nScanning: ${target}...`);

        if (!fs.existsSync(fullPath)) {
            console.error(`[CRITICAL] Target not found: ${fullPath}`);
            continue;
        }

        const content = fs.readFileSync(fullPath, 'utf8');

        for (const rule of AUDIT_RULES) {
            const matches = content.match(rule.pattern);
            if (rule.inverse) {
                if (!matches) {
                    console.warn(`[WARNING] ${rule.name}: ${rule.warning}`);
                    issuesFound++;
                }
            } else if (matches) {
                console.warn(`[ISSUE] ${rule.name}: ${rule.warning} (${matches.length} instances)`);
                issuesFound += matches.length;
            }
        }
    }

    console.log('\n--- SCAN COMPLETE ---');
    console.log(`Total compliance issues found: ${issuesFound}`);

    if (issuesFound > 5) {
        console.log('[SAFE-FAIL] Certification threshold exceeded. Implementing stasis protocol.');
        process.exit(1);
    } else {
        console.log('[SUCCESS] Integrity verified. Proceeding to Golden State v3.0-EXT.');
        process.exit(0);
    }
}

runAudit();
