const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function check() {
    const { data, error } = await supabase
        .from('ghost_bridge')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('DB_ERROR:', error);
        return;
    }

    console.log('LATEST_COMMANDS:');
    data.forEach(d => {
        console.log(`[${d.status}] ${d.command} -> ${d.output || 'no output'}`);
    });
}
check();
