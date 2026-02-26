const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpam() {
    console.log(`Checking project: ${supabaseUrl}`);
    const { data, error } = await supabase
        .from('ghost_bridge')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Query error:', error);
        return;
    }

    console.log('\n--- Recent Ghost Bridge Activity ---');
    data.forEach(cmd => {
        console.log(`[${cmd.created_at}] [${cmd.source || 'no-source'}] [${cmd.status}] ${cmd.command}`);
    });
}

checkSpam();
