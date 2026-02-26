
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function injectDiagnostic() {
    console.log('Injecting test diagnostic record...');

    const { data, error } = await supabase
        .from('matrix_diagnostics')
        .insert({
            app: 'nexus',
            category: 'action',
            severity: 'info',
            action: 'Test Diagnostic Injection',
            metadata: { source: 'manual_verification_script' },
            duration: 123
        })
        .select();

    if (error) {
        console.error('Failed to inject:', error);
    } else {
        console.log('Success! Record injected:', data);
        console.log('Check Nexus Dashboard for "Test Diagnostic Injection" entry.');
    }
}

injectDiagnostic();
