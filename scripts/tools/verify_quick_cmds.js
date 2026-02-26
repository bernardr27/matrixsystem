
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

async function verifyAll() {
    const commands = ['sage:status', 'sage:logs', 'sage:scan'];

    for (const cmdText of commands) {
        console.log(`\nTesting: ${cmdText}...`);
        const { data: cmd } = await supabase.from('ghost_bridge').insert({
            command: cmdText,
            status: 'pending'
        }).select('id').single();

        let attempts = 0;
        while (attempts < 5) {
            await new Promise(r => setTimeout(r, 1000));
            const { data: res } = await supabase.from('ghost_bridge').select('status, output').eq('id', cmd.id).single();
            if (res.status === 'executed' || res.status === 'failed') {
                console.log(`Result: ${res.status}`);
                console.log(`Output: ${res.output.substring(0, 100)}...`);
                break;
            }
            attempts++;
        }
    }
}

verifyAll();
