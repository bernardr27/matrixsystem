const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function send(command) {
    const { data, error } = await supabase.from('ghost_bridge').insert({
        command,
        source: 'matrix_cli',
        status: 'pending'
    }).select().single();

    if (error) throw error;
    console.log(`Queued: ${command}`);
    console.log(`ID: ${data.id}`);
}

async function main() {
    const action = (process.argv[2] || 'list').toLowerCase();
    const id = process.argv[3];
    const target = process.argv[4];

    if (action === 'list') return send('cap:list');
    if (action === 'show') {
        if (!id) throw new Error('Usage: node scripts/tools/trigger_capability.js show <capability_id>');
        return send(`cap:show ${id}`);
    }
    if (action === 'run') {
        if (!id) throw new Error('Usage: node scripts/tools/trigger_capability.js run <capability_id> [target]');
        return send(`cap:run ${id}${target ? ` ${target}` : ''}`);
    }
    if (action === 'gate') return send('cap:gate');

    throw new Error('Unknown action. Use: list | show | run | gate');
}

main().catch(err => {
    console.error(`Capability trigger failed: ${err.message}`);
    process.exit(1);
});
