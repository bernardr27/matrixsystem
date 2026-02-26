
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load .env manually for this script
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('ghost_bridge')
        .select('id, command, status, output, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Supabase Error:', error);
        process.exit(1);
    }

    console.log(JSON.stringify(data, null, 2));
}

check();
