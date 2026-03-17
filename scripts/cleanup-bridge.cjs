const { createSupabaseFromEnv } = require('./tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function cleanup() {
    console.log('--- Cleaning Ghost Bridge ---');
    const { count, error } = await supabase.from('ghost_bridge').delete().eq('status', 'pending');
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Successfully purged ${count || 0} pending commands.`);
    }
}

cleanup();
