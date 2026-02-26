const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
    console.log("Triggering test synthesis...");
    const { data, error } = await supabase.from('ghost_bridge').insert({
        command: 'sage:component TestStatCard | A simple card with an icon and a "Neural Link" status text.',
        source: 'manual_verification',
        status: 'pending'
    }).select().single();

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Command inserted, ID:", data.id);
        console.log("Waiting for execution...");

        const interval = setInterval(async () => {
            const { data: cmd } = await supabase.from('ghost_bridge').select('status, output').eq('id', data.id).single();
            console.log("Current Status:", cmd?.status);
            if (cmd?.status === 'executed' || cmd?.status === 'failed') {
                console.log("Result:", cmd.output);
                clearInterval(interval);
                process.exit(0);
            }
        }, 3000);
    }
}

test();
