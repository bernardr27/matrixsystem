const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials in root .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function delegateMission(planPath) {
    if (!planPath) {
        console.error('❌ Error: No plan path provided.');
        console.log('Usage: npm run delegate "path/to/prd.json"');
        process.exit(1);
    }

    const resolvedPath = path.resolve(planPath);
    console.log(`🚀 DELEGATING MISSION: ${resolvedPath}`);

    const { data, error } = await supabase.from('ghost_bridge').insert({
        command: `sage:delegate ${resolvedPath}`,
        source: 'matrix_cli',
        status: 'pending'
    }).select().single();

    if (error) {
        console.error('❌ Failed to delegate mission:', error.message);
        process.exit(1);
    }

    console.log(`✅ MISSION DISPATCHED [ID: ${data.id}]`);
    console.log('Monitoring Ghost Runner for execution...');
}

const args = process.argv.slice(2);
delegateMission(args[0]);
