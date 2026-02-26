/**
 * Schema Discovery for profiles
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function discover() {
    console.log('🔍 Discovering profiles schema...');

    const { data: profile, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error('❌ Error fetching profiles:', error.message);
        return;
    }

    if (profile && profile.length > 0) {
        console.log('✅ Found profile columns:', Object.keys(profile[0]).join(', '));
    } else {
        console.log('⚠️ No profiles found to inspect. Attempting to fetch from information_schema...');
        const { data: columns, error: cError } = await supabase.rpc('get_table_columns', { t_name: 'profiles' });
        if (cError) {
            console.log('⚠️ RPC failed or not allowed. Trying a generic select with known columns...');
            // If we can't find columns, we'll just try to upsert a minimal profile
        } else {
            console.log('Columns:', columns);
        }
    }
}

discover();
