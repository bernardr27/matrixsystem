/**
 * Matrix Auto-Onboard v1.0
 * Purpose: Automated context acquisition and system heartbeat verification.
 * Execution: node g:\matrix\get_started\AUTO_ONBOARD.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PATHS = {
    ROOT: 'G:/matrix',
    DIRECTIVES: 'G:/matrix/get_started',
    REPORTS: 'G:/matrix/scripts/reports'
};

function runHeartbeat() {
    console.log('--- INITIALIZING MATRIX HEARTBEAT ---');
    try {
        const smoke = execSync('node g:/matrix/scripts/smoke_test.js').toString();
        console.log(smoke);
    } catch (e) {
        console.error('[CRITICAL] Heartbeat failure. System state unstable.');
    }
}

function acquireDirectives() {
    console.log('\n--- ACQUIRING CORE DIRECTIVES ---');
    const files = fs.readdirSync(PATHS.DIRECTIVES);
    files.filter(f => f.endsWith('.md')).forEach(file => {
        console.log(`[READY] ${file}`);
    });
}

function scanWorkspace() {
    console.log('\n--- MAPPING NEURAL TOPOLOGY ---');
    const apps = fs.readdirSync(path.join(PATHS.ROOT, 'apps'));
    console.log(`Active Nodes: ${apps.join(', ')}`);

    const core = fs.readdirSync(path.join(PATHS.ROOT, 'core'));
    console.log(`Core Infrastructure: ${core.join(', ')}`);
}

async function main() {
    console.log(`\n==========================================`);
    console.log(`MATRIX_ONBOARDING_PROTOCOL :: ACTIVE`);
    console.log(`TIMESTAMP: ${new Date().toISOString()}`);
    console.log(`==========================================\n`);

    runHeartbeat();
    acquireDirectives();
    scanWorkspace();

    console.log('\n[CONCLAVE] Intelligence oriented. Proceed to MASTER_PROMPT.md.');
}

main();
