const { createSupabaseFromEnv } = require('../tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function simulateCrash() {
    console.log('[TEST] Simulating Critical Error Storm for Reflect...');

    const errors = [];
    for (let i = 0; i < 5; i++) {
        errors.push({
            app: 'reflect',
            category: 'error',
            severity: 'critical',
            action: 'runtime_exception',
            metadata: { error: 'SIMULATED_CRASH', reason: 'Testing GhostBrain Reflex' },
            session_id: 'test_sim_001',
            timestamp: new Date().toISOString()
        });
    }

    const { error } = await supabase.from('matrix_diagnostics').insert(errors);

    if (error) {
        console.error('[TEST] Failed to insert errors:', error);
    } else {
        console.log('[TEST] Inserted 5 Critical Errors. GhostBrain should react within 30 seconds.');
    }
}

simulateCrash();
