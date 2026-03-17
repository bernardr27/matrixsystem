const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function trigger() {
    const { data, error } = await supabase
        .from('ghost_bridge')
        .insert({
            command: 'sys:deep_ignite',
            status: 'pending',
            source: 'nexus_remote'
        });

    if (error) {
        console.error('DB_ERROR:', error);
        return;
    }

    console.log('DEEP_IGNITE_INSERTED');
}
trigger();
