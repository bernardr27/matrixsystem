
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

async function verify() {
    // 1. Send fs:list ./
    const { data: cmd, error: insErr } = await supabase.from('ghost_bridge').insert({
        command: 'fs:list ./',
        status: 'pending'
    }).select('id').single();

    if (insErr) { console.error('Insert error:', insErr); return; }
    console.log(`Command sent: ${cmd.id}. Waiting for execution...`);

    // 2. Wait for execution (max 10s)
    let attempts = 0;
    while (attempts < 10) {
        await new Promise(r => setTimeout(r, 1000));
        const { data: res, error: selErr } = await supabase.from('ghost_bridge').select('status, output').eq('id', cmd.id).single();
        if (selErr) { console.error('Select error:', selErr); return; }

        if (res.status === 'executed' || res.status === 'failed') {
            console.log(`Status: ${res.status}`);
            console.log(`Output: ${res.output}`);
            break;
        }
        attempts++;
    }
}

verify();
