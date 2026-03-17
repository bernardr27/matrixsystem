const { createSupabaseFromEnv } = require('../tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function verify() {
    console.log("Verifying Voice Command...");
    const { data, error } = await supabase
        .from('ghost_bridge')
        .select('status, output, created_at')
        .eq('command', 'sage:speak Initializing Ghost Hand protocols. Systems active.')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) console.error("Error:", error);
    else console.log(JSON.stringify(data, null, 2));
}

verify();
