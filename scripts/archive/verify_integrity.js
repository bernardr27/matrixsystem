const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verifyIntegrity() {
    console.log('--- STARTING SYSTEM INTEGRITY AUDIT ---');

    // 1. Latency Check
    const start = Date.now();
    const cmdId = crypto.randomUUID();
    console.log(`[LATENCY] Dispatching ping (${cmdId})...`);

    const { error } = await supabase.from('ghost_bridge').insert({
        id: cmdId,
        command: 'sys:ping',
        source: 'audit_script',
        status: 'pending'
    });

    if (error) {
        console.error('[LATENCY] FAILED to dispatch:', error.message);
        return;
    }

    // Wait for echo (simulated by checking if row exists/updates - usually Sentinel would ack, but we check DB roundtrip)
    const { data: pingData } = await supabase.from('ghost_bridge').select('*').eq('id', cmdId).single();
    const latency = Date.now() - start;
    console.log(`[LATENCY] Database Roundtrip: ${latency}ms`);
    if (latency > 1000) console.warn('[LATENCY] WARNING: High Latency Detected!');
    else console.log('[LATENCY] STATUS: EXCELLENT');

    // 2. Data Accuracy (Heartbeat)
    console.log('\n[ACCURACY] Verifying Heartbeat Stream...');
    const { data: hearts } = await supabase
        .from('ghost_bridge')
        .select('*')
        .eq('command', 'sys:heartbeat')
        .order('created_at', { ascending: false })
        .limit(5);

    if (!hearts || hearts.length === 0) {
        console.error('[ACCURACY] NO HEARTBEATS FOUND. System is comatose.');
    } else {
        const latest = hearts[0];
        const age = Date.now() - new Date(latest.created_at).getTime();
        console.log(`[ACCURACY] Latest Heartbeat Age: ${Math.floor(age / 1000)}s`);

        try {
            const payload = JSON.parse(latest.output);
            console.log('[ACCURACY] Services Reported:', Object.keys(payload.services || {}).join(', '));
            if (age > 10000) console.warn('[ACCURACY] WARNING: Stale Heartbeat!');
            else console.log('[ACCURACY] STATUS: SYNCED');
        } catch (e) {
            console.error('[ACCURACY] Malformed Heartbeat Payload');
        }
    }

    // 3. Alert System verify
    console.log('\n[ALERTS] Testing Broadcast System...');
    const alertId = crypto.randomUUID();
    const alertMsg = "AUDIT_DRILL_TEST_ALERT";
    await supabase.from('ghost_bridge').insert({
        id: alertId,
        command: 'sys:broadcast',
        source: 'audit_script',
        status: 'executed',
        output: alertMsg
    });
    console.log(`[ALERTS] Injected Test Alert: ${alertMsg}`);
    console.log('[ALERTS] Check UI AuraMonitor for confirmation.');

    console.log('\n--- AUDIT COMPLETE ---');
}

verifyIntegrity();
