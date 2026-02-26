const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function restartGhost() {
    console.log('Requesting Ghost Command restart...');

    // Command to Sentinel to restart the ghost service
    const { error } = await supabase.from('ghost_bridge').insert({
        command: 'sys:restart_ghost',
        status: 'pending'
    });

    if (error) console.error('Error:', error);
    else console.log('Restart command sent.');
}

restartGhost();
