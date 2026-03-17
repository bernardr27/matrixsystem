const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function checkBridge() {
    console.log('--- BRIDGE AUDIT ---');

    // 1. Check for stuck pending commands
    const { data: pending, error: pendingError } = await supabase
        .from('ghost_bridge')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

    if (pendingError) console.error('Pending Error:', pendingError);
    else {
        console.log(`Pending Commands (${pending.length}):`);
        pending.forEach(c => console.log(`- [${c.created_at}] ${c.command} (Source: ${c.source})`));
    }

    // 2. Check recent heartbeats
    const { data: hearts, error: heartError } = await supabase
        .from('ghost_bridge')
        .select('*')
        .eq('command', 'sys:heartbeat')
        .order('created_at', { ascending: false })
        .limit(3);

    if (heartError) console.error('Heartbeat Error:', heartError);
    else {
        console.log(`\nRecent Heartbeats (${hearts.length}):`);
        hearts.forEach(c => {
            console.log(`- [${c.created_at}] Source: ${c.source}`);
            console.log(c.output); // Print FULL output
        });
    }
}

checkBridge();
