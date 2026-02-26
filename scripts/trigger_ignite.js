const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function ignite() {
    console.log("Triggering Full System Ignition...");
    const { data, error } = await supabase.from('ghost_bridge').insert({
        command: 'sys:ignite',
        source: 'manual_verification',
        status: 'pending'
    }).select().single();

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Ignition command inserted, ID:", data.id);
        console.log("The system will now reboot all modules.");
        process.exit(0);
    }
}

ignite();
