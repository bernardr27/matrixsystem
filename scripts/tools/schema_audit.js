const { createSupabaseFromEnv } = require('./_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function checkSchema() {
    console.log('Auditing ghost_bridge schema...');
    // We can't directly query schema via JS client easily, but we can try to insert a dummy row with all columns we expect
    const { error } = await supabase.from('ghost_bridge').insert({
        command: 'test',
        source: 'audit',
        status: 'test',
        output: 'test',
        executed: false
    });

    if (error) {
        console.log('Error detail:', JSON.stringify(error, null, 2));
    } else {
        console.log('Insert success. All columns present.');
    }
}

checkSchema();
