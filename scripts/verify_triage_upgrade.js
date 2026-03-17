const { createSupabaseFromEnv } = require('./tools/_supabase_client.cjs');
const TriageHandler = require('../apps/ghost-command/core/handlers/triage-handler');

const supabase = createSupabaseFromEnv();

async function verifyTriage() {
    console.log('--- VERIFYING TRIAGE UPGRADE ---');

    // 1. Inject a Mock Critical Error to test detection
    console.log('1. Injecting Mock Critical Error...');
    await supabase.from('matrix_diagnostics').insert({
        app: 'nexus',
        category: 'error',
        severity: 'critical',
        action: 'test_fatal_crash',
        error: 'SIMULATED CRITICAL FAILURE',
        timestamp: new Date().toISOString()
    });

    // 2. Run Triage Scan
    console.log('2. Running Health Scan...');
    const context = {};
    const handler = new TriageHandler(supabase, context);

    // Mock command object
    const cmd = { id: 'test-cmd-123', command: 'triage:health', payload: JSON.stringify({ app: 'all' }) };

    // We need to spy on 'updateStatus' or just check the DB after
    // But since handler.runHealthScan writes to DB, we can just check DB.

    await handler.handle(cmd);

    // 3. Check Results
    console.log('3. Checking DB for Report...');
    const { data: reports } = await supabase
        .from('ghost_bridge')
        .select('output')
        .eq('command', 'triage:result')
        .ilike('output', '{%') // Only JSON starting with {
        .order('created_at', { ascending: false })
        .limit(3);

    reports.forEach((r, i) => {
        try {
            console.log(`[RAW_${i}]`, r.output);
            const json = JSON.parse(r.output);
            console.log(`[REPORT_${i}] App: ${json.app} | Score: ${json.healthScore} | Issues: ${json.issues} | Mem: ${json.memory}`);
        } catch (e) {
            console.log(`[FAIL_${i}] Could not parse JSON`, r.output);
        }
    });

    console.log('--- VERIFICATION COMPLETE ---');
}

verifyTriage();
