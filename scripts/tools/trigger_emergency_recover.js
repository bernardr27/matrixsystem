const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

function loadEnv() {
    const root = path.resolve(__dirname, '..', '..');
    const files = ['.env', '.env.local', '.env.production', '.env.production.local'];
    for (const rel of files) {
        const full = path.join(root, rel);
        if (!fs.existsSync(full)) continue;
        const parsed = dotenv.parse(fs.readFileSync(full, 'utf8'));
        for (const [k, v] of Object.entries(parsed)) {
            if (!(k in process.env)) process.env[k] = v;
        }
    }
}

async function trigger() {
    loadEnv();
    const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
    const anon = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '').trim();
    if (!url || !anon) {
        console.error('SUPABASE_NOT_CONFIGURED');
        process.exit(1);
    }
    const supabase = createClient(url, anon);

    const { error } = await supabase
        .from('ghost_bridge')
        .insert({
            command: 'sys:emergency_recover',
            status: 'pending',
            source: 'ops_cli'
        });

    if (error) {
        console.error('DB_ERROR:', error.message);
        process.exit(1);
    }

    console.log('EMERGENCY_RECOVER_INSERTED');
}

trigger().catch((error) => {
    console.error('TRIGGER_FAILED:', error instanceof Error ? error.message : String(error));
    process.exit(1);
});
