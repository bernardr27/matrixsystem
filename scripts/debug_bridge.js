const { createSupabaseFromEnv } = require('./tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function debugBridge() {
    const { data: rows } = await supabase
        .from('ghost_bridge')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log(JSON.stringify(rows, null, 2));
}

debugBridge();
