
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

async function checkRecent() {
    const twoMinsAgo = new Date(Date.now() - 120000).toISOString();
    console.log(`Checking for failures since ${twoMinsAgo}`);

    const { data, error } = await supabase
        .from('ghost_bridge')
        .select('*')
        .gt('created_at', twoMinsAgo)
        .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }
    console.log(JSON.stringify(data, null, 2));
}

checkRecent();
