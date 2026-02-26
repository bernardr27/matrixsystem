const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function runTest() {
    console.log('Injecting simulated messages for TAILWIND verification...');

    // 1. Simulate AI Response (Success)
    await supabase.from('ghost_bridge').insert({
        command: 'sys:ui_test_tailwind',
        status: 'executed',
        output: 'SAGE: [VISUAL_CONFIRMATION] Tailwind CSS engine active. Stylesheet loaded. Glassmorphism enabled.'
    });

    console.log('Injection complete.');
}

runTest();
