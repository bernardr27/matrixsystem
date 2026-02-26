const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inject() {
    console.log('Injecting Test Vector...');
    const { error } = await supabase.from('ghost_bridge').insert({
        command: 'sage:System Integrity Check Initiated...',
        status: 'pending'
    });
    if (error) console.error('Error:', error);
    else console.log('Vector Sent! Check Ghost Command UI.');
    process.exit();
}

inject();
