console.log('[MATRIX AUDIT] Script started.');
console.warn('[DEPRECATED] scripts/tools/matrix_audit.js is legacy.');
console.warn('[DEPRECATED] Use: npm run cloud:preflight or npm run ops:autopilot:quick.');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("[MATRIX AUDIT] [FAIL] Missing SUPABASE_URL or SUPABASE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function performAudit() {
    console.log('[MATRIX AUDIT] Initiating Connectivity Check...');

    // Simple health check by verifying we can write to the bridge
    const { error } = await supabase.from('ghost_bridge').insert({
        command: 'AUDIT_PING',
        source: 'matrix_doctor',
        status: 'verifying',
        output: 'connection_test',
        executed: true
    });

    if (error) {
        console.error('[MATRIX AUDIT] [FAIL] Connection Refused or Schema Invalid.');
        console.error('Detail:', error.message);
    } else {
        console.log('[MATRIX AUDIT] [PASS] Database Connected & Writable.');
    }
}

performAudit();
