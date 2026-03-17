const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function testKill() {
    console.log('Sending sys:kill_all command (Legacy Purge)...');
    const { error } = await supabase.from('ghost_bridge').insert({
        command: 'sys:kill_all',
        source: 'debug_script_purge',
        status: 'pending'
    });
    if (error) console.error('Error:', error);
    else console.log('Command sent. Watch the Sentinel terminal.');
}

testKill();
