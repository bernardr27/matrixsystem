const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function trigger() {
    const { data, error } = await supabase
        .from('ghost_bridge')
        .insert({
            command: 'sys:stop_ghost',
            status: 'pending',
            source: 'nexus_remote'
        });

    if (error) {
        console.error('DB_ERROR:', error);
        return;
    }

    console.log('STOP_GHOST_INSERTED');
}
trigger();
