const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function cleanup() {
    console.log('--- Cleaning Ghost Bridge ---');
    const { count, error } = await supabase.from('ghost_bridge').delete().eq('status', 'pending');
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Successfully purged ${count || 0} pending commands.`);
    }
}

cleanup();
