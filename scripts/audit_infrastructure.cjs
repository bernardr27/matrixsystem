const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkInfrastructure() {
    console.log('🔍 Auditing Matrix V9 Infrastructure...');

    const tables = [
        'matrix_instances',
        'collective_insights',
        'hive_market_tasks',
        'hive_consensus_votes',
        'singularity_event_log'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ Table [${table}] check failed: ${error.message}`);
        } else {
            console.log(`✅ Table [${table}] exists and is accessible.`);
        }
    }

    // Check specific columns added in V9
    console.log('\n🔍 Auditing Schema Updates...');

    // Check collective_insights for new columns
    const { data: insights, error: insightErr } = await supabase.from('collective_insights').select('*').limit(1);
    if (!insightErr && insights) {
        const cols = Object.keys(insights[0] || {});
        if (cols.includes('verification_status')) {
            console.log('✅ Column [collective_insights.verification_status] exists.');
        } else {
            console.error('❌ Column [collective_insights.verification_status] MISSING.');
        }
    }

    console.log('\n🚀 Infrastructure Audit Complete.');
}

checkInfrastructure();
