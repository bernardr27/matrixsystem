const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function clean() {
    console.log('--- CLEANING GHOST DB ---');

    // 1. Delete all heartbeats
    const { error: err1, count } = await supabase
        .from('ghost_bridge')
        .delete({ count: 'exact' })
        .eq('command', 'sys:heartbeat');

    if (err1) console.error('Error deleting heartbeats:', err1);
    else console.log(`Deleted ${count} heartbeat records.`);

    // 2. Reset any 'executing' commands to 'failed' (to unstick UI)
    const { error: err2 } = await supabase
        .from('ghost_bridge')
        .update({ status: 'failed', output: 'System Reset: Process Terminated' })
        .eq('status', 'executing');

    if (err2) console.error('Error resetting active commands:', err2);
    else console.log('Reset stalled commands to failed state.');
}

clean();
