const { createSupabaseFromEnv } = require('../tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function testVoice() {
    console.log("Dispatching Voice Command...");
    const { error } = await supabase.from('ghost_bridge').insert({
        command: 'sage:speak Initializing Ghost Hand protocols. Systems active.',
        source: 'nexus_dashboard',
        status: 'pending'
    });
    if (error) console.error("Error:", error);
    else console.log("Command sent!");
}

testVoice();
