require('dotenv').config({ path: 'g:\\matrix\\.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function debugBridge() {
    const { data: rows } = await supabase
        .from('ghost_bridge')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log(JSON.stringify(rows, null, 2));
}

debugBridge();
