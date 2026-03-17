const { createSupabaseFromEnv } = require('../tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function testFullVision() {
    console.log('[TEST] Initiating Ghost Vision Sequence...');

    // 1. SNAP
    console.log('[STEP 1] Snapping Phantom Mirror...');
    const { data: snapCmd, error: snapErr } = await supabase.from('ghost_bridge').insert({
        command: 'snap',
        source: 'test_full_vision',
        status: 'pending'
    }).select().single();

    if (snapErr) return console.error('[FAIL] Snap Init:', snapErr);

    const imageUrl = await waitForCommand(snapCmd.id);
    if (!imageUrl || !imageUrl.startsWith('FILE_READY: ')) {
        return console.error('[FAIL] Snap failed or timed out:', imageUrl);
    }

    const cleanUrl = imageUrl.replace('FILE_READY: ', '').trim();
    console.log('[SUCCESS] Image Captured:', cleanUrl);

    // 2. SEE
    console.log('[STEP 2] Analyzing with Vision Cortex...');
    const { data: seeCmd, error: seeErr } = await supabase.from('ghost_bridge').insert({
        command: `sage:see ${cleanUrl}|Describe this desktop screenshot in detail.`,
        source: 'test_full_vision',
        status: 'pending'
    }).select().single();

    if (seeErr) return console.error('[FAIL] See Init:', seeErr);

    const description = await waitForCommand(seeCmd.id, 60000); // Give AI 60s
    console.log('\n[VISION RESULT]');
    console.log('---------------------------------------------------');
    console.log(description);
    console.log('---------------------------------------------------');
}

async function waitForCommand(id, timeoutMs = 30000) {
    const start = Date.now();
    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            const { data } = await supabase.from('ghost_bridge').select('*').eq('id', id).single();
            if (data.status === 'executed') {
                clearInterval(interval);
                resolve(data.output);
            } else if (data.status === 'failed') {
                clearInterval(interval);
                resolve(data.output); // Return error as output
            } else if (Date.now() - start > timeoutMs) {
                clearInterval(interval);
                resolve('TIMEOUT');
            }
        }, 2000);
    });
}

testFullVision();
