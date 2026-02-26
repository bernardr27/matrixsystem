const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
    console.log("Checking Ghost Runner pulse...");
    try {
        const { data, error } = await supabase
            .from('ghost_bridge')
            .select('*')
            .eq('command', 'sys:heartbeat')
            .eq('source', 'ghost_runner')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error("Supabase Error:", error.message);
        } else if (data?.[0]) {
            const hb = data[0];
            const ageSeconds = (Date.now() - new Date(hb.created_at).getTime()) / 1000;
            console.log("Latest Heartbeat:", hb.output);
            console.log("Age (seconds):", ageSeconds);
            console.log("Status:", hb.status);
        } else {
            console.log("No heartbeats found.");
        }
    } catch (e) {
        console.error("Execution Error:", e.message);
    }
}

check().then(() => {
    console.log("Check complete.");
    process.exit(0);
}).catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
