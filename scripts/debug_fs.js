const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'g:\\matrix\\.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testFs() {
    console.log("Testing FS Handler...");

    // 1. Send FS List Command
    const { data, error } = await supabase.from('ghost_bridge').insert({
        command: 'fs:list g:\\matrix',
        status: 'pending',
        source: 'manual_debug'
    }).select('id').single();

    if (error) {
        console.error('❌ Failed to insert command:', error);
        return;
    }

    console.log(`✅ Command sent (ID: ${data.id}). Waiting for response...`);

    // 2. Poll for response
    let attempts = 0;
    const interval = setInterval(async () => {
        attempts++;
        const { data: res } = await supabase
            .from('ghost_bridge')
            .select('*')
            .eq('id', data.id)
            .single();

        if (res.status === 'executed' || res.status === 'failed') {
            console.log(`\n📬 Response Received [${res.status}]:`);
            console.log('Output length:', res.output?.length);
            console.log('Preview:', res.output?.substring(0, 200));
            clearInterval(interval);
        } else {
            process.stdout.write('.');
        }

        if (attempts > 30) {
            console.log('\n❌ Timeout: No response from ghost-runner after 30s.');
            clearInterval(interval);
        }
    }, 1000);
}

testFs();
