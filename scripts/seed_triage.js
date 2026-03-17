const { createSupabaseFromEnv } = require('./tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

async function seed() {
    console.log("Seeding Triage Data...");
    const payload = {
        app: 'nexus',
        healthScore: 98,
        issues: 0,
        memory: { used: '124MB', total: '16GB' },
        timestamp: new Date().toISOString()
    };

    const { error } = await supabase.from('ghost_bridge').insert({
        command: 'triage:boot_health',
        output: JSON.stringify(payload),
        status: 'executed',
        source: 'manual_seed'
    });

    if (error) console.error('Error:', error);
    else console.log('✅ Triage data seeded!');
}

seed();
