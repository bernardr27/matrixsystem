const { createSupabaseFromEnv } = require('../tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function checkReflex() {
    console.log('[VERIFY] Checking Ghost Bridge for Brain Activity...');

    const { data, error } = await supabase
        .from('ghost_bridge')
        .select('*')
        .eq('source', 'ghost_brain')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('[FAIL] Query Error:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('[SUCCESS] Brain Reflexes Found:');
        data.forEach(cmd => {
            console.log(` - [${cmd.created_at}] ${cmd.command} (${cmd.status})`);
            console.log(`   Output: ${cmd.output}`);
        });
    } else {
        console.log('[INFO] No Brain Reflexes found yet.');
    }
}

checkReflex();
