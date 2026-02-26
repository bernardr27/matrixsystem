require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verifySage() {
    console.log('[TEST] Dispatching query to Sage...');

    // 1. Send Command
    const { data: cmd, error } = await supabase.from('ghost_bridge').insert({
        command: 'sage:Report current system status and load.',
        status: 'pending',
        source: 'verification_script'
    }).select().single();

    if (error) {
        console.error('[FAIL] Could not insert command:', error.message);
        return;
    }

    console.log(`[TEST] Command dispatched (ID: ${cmd.id}). Waiting for Sovereign response...`);

    // 2. Poll for Response
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(async () => {
        attempts++;
        const { data: updated } = await supabase.from('ghost_bridge').select('*').eq('id', cmd.id).single();

        if (updated.status === 'executed') {
            clearInterval(interval);
            console.log('\n[SAGE RESPONSE]:', updated.output);

            // 3. Verify Telemetry presence
            if (updated.output.match(/\d+%/) || updated.output.match(/Free/) || updated.output.match(/CPU/)) {
                console.log('✅ [SUCCESS] Telemetry detected in response.');
            } else {
                console.log('⚠️ [WARNING] No telemetry detected. Old Persona may still be active.');
            }
            process.exit(0);
        } else if (updated.status === 'failed') {
            clearInterval(interval);
            console.error('❌ [FAIL] Sage failed to process:', updated.output);
            process.exit(1);
        }

        if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.error('❌ [TIMEOUT] Sage did not respond.');
            process.exit(1);
        }

        process.stdout.write('.');
    }, 1000);
}

verifySage();
