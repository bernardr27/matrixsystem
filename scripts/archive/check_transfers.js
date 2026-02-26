const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkTransfers() {
    console.log('--- Checking Ghost Bridge for Transfers ---');

    // Get last 10 transfer commands
    const { data, error } = await supabase
        .from('ghost_bridge')
        .select('*')
        .ilike('command', 'transfer:%')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching transfers:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No recent transfer commands found.');
    } else {
        data.forEach(row => {
            console.log(`[${row.status}] ${row.command} (${row.created_at})`);
            if (row.output) console.log(`   Output: ${row.output.substring(0, 100)}...`);
        });
    }
}

checkTransfers();
