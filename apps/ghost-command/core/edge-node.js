require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[EDGE-NODE] FATAL: Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const NODE_NAME = 'azure-edge-01';

console.log(`[EDGE-NODE] 🦅 ${NODE_NAME} initialized. Awaiting commands...`);

// Log startup
supabase.rpc('log_system_event', {
    p_source: NODE_NAME,
    p_event_type: 'edge_boot',
    p_message: 'Matrix Edge Node connected to Ghost Bridge',
    p_metadata: { os: 'linux', capabilities: ['bash', 'scrape', 'ping'] }
}).then(() => { }).catch(() => { });

// Listen to the Ghost Bridge
supabase.channel('ghost_bridge_edge')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ghost_bridge' }, payload => {
        const { id, command, agent_id } = payload.new;

        // Only react if specifically targeted or broadcast to 'edge'
        if (agent_id === NODE_NAME || command.startsWith('edge:')) {
            console.log(`[EDGE-NODE] ⚡ Received command [${id}]: ${command}`);

            const cmdToRun = command.replace('edge:', '').trim();

            exec(cmdToRun, async (err, stdout, stderr) => {
                const output = err ? stderr : stdout;
                const status = err ? 'failed' : 'completed';

                console.log(`[EDGE-NODE] 📤 Output [${status}]:\n${output}`);

                await supabase.from('ghost_bridge').update({
                    status: status,
                    output: output.substring(0, 4000) // Keep it brief for the DB
                }).eq('id', id);
            });
        }
    })
    .subscribe();
