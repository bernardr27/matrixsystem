const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkSchema() {
    console.log('--- Verifying ghost_bridge Schema ---');

    // Check if table exists by selecting 1 row
    const { data, error } = await supabase.from('ghost_bridge').select('*').limit(1);

    if (error) {
        console.error('[CRITICAL] Table access failed:', error.message);
        process.exit(1);
    }

    if (data.length === 0) {
        console.log('[INFO] Table exists but is empty.');
    } else {
        const sample = data[0];
        console.log('[OK] Table exists and is accessible.');
        console.log('[INFO] Detected Columns:', Object.keys(sample).join(', '));

        // Verify critical columns
        const required = ['id', 'command', 'status', 'output', 'source'];
        const missing = required.filter(col => !Object.keys(sample).includes(col));

        if (missing.length > 0) {
            console.error('[WARNING] Potential missing columns (might be null):', missing);
            // If they are missing from keys, it might just be because they are null, 
            // but this confirms the table is readable.
        } else {
            console.log('[SUCCESS] Core schema appears valid.');
        }
    }
    process.exit(0);
}

checkSchema();
