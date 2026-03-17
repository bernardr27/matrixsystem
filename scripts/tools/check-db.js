const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function checkDB() {
    console.log('Checking recent ghost_bridge entries...');
    const { data, error } = await supabase
        .from('ghost_bridge')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) console.error('Error:', error);
    else console.log(JSON.stringify(data, null, 2));
}

checkDB();
