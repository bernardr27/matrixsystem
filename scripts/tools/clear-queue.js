const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function clearQueue() {
    console.log('Clearing pending commands...');
    const { data, error } = await supabase
        .from('ghost_bridge')
        .update({ status: 'executed', output: 'EMERGENCY_CLEAR' })
        .eq('status', 'pending');

    if (error) console.error('Error clearing queue:', error);
    else console.log('Successfully cleared queue.');
}

clearQueue();
