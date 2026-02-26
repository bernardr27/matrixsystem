const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' }); // Adjust path as needed

// Hardcode connection for the test script to avoid path dancing
const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateCrash() {
    console.log('[TEST] Simulating Critical Error Storm for Reflect...');

    const errors = [];
    for (let i = 0; i < 5; i++) {
        errors.push({
            app: 'reflect',
            category: 'error',
            severity: 'critical',
            action: 'runtime_exception',
            metadata: { error: 'SIMULATED_CRASH', reason: 'Testing GhostBrain Reflex' },
            session_id: 'test_sim_001',
            timestamp: new Date().toISOString()
        });
    }

    const { error } = await supabase.from('matrix_diagnostics').insert(errors);

    if (error) {
        console.error('[TEST] Failed to insert errors:', error);
    } else {
        console.log('[TEST] Inserted 5 Critical Errors. GhostBrain should react within 30 seconds.');
    }
}

simulateCrash();
