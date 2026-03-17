const { createSupabaseFromEnv } = require('../tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function testVision() {
    console.log('[VISION TEST] Requesting "snap"...');

    // Insert SNAP command
    const { data, error } = await supabase.from('ghost_bridge').insert({
        command: 'snap',
        source: 'test_vision',
        status: 'pending'
    }).select().single();

    if (error) {
        console.error('[FAIL] Could not insert command:', error.message);
        return;
    }

    const setTime = Date.now();
    const cmdId = data.id;
    console.log(`[WAITING] Command ID: ${cmdId}`);

    // Poll for result
    const interval = setInterval(async () => {
        const { data: cmd } = await supabase.from('ghost_bridge').select('*').eq('id', cmdId).single();

        if (cmd.status === 'executed') {
            clearInterval(interval);
            console.log('[SUCCESS] Vision Captured!');
            console.log(`Payload: ${cmd.output}`);
        } else if (cmd.status === 'failed') {
            clearInterval(interval);
            console.error('[FAIL] Vision Error:', cmd.output);
        } else if (Date.now() - setTime > 30000) {
            clearInterval(interval);
            console.error('[TIMEOUT] No response in 30s.');
        }
    }, 2000);
}

testVision();
