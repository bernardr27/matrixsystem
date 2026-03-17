const { createSupabaseFromEnv } = require('../tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function check() {
    const { data, error } = await supabase.from('matrix_diagnostics').select('*').order('created_at', { ascending: false }).limit(5);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('--- DIAGNOSTICS ---');
        console.log(JSON.stringify(data, null, 2));
    }
}
check();
