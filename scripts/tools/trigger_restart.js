const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function trigger() {
    const { data, error } = await supabase
        .from('ghost_bridge')
        .insert({
            command: 'sys:restart_all',
            status: 'pending',
            source: 'nexus_remote'
        });

    if (error) {
        console.error('DB_ERROR:', error);
        return;
    }

    console.log('RESTART_COMMAND_INSERTED');
}
trigger();
