const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkLogs() {
    const { data, error } = await supabase
        .from('ghost_bridge')
        .select('*')
        .neq('command', 'sys:heartbeat') // Filter unwanted heartbeats
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) console.error('Error:', error);
    else console.log(JSON.stringify(data, null, 2));
}

checkLogs();
