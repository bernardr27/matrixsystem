const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVision() {
    console.log('[VISION TEST] Requesting "snap"...');

    // Insert SNAP command
    const { data, error } = await supabase.from('ghost_bridge').insert({
        command: 'snap',
        source: 'test_vision',
        status: 'pending'
    }).select().single();

    if (error) {
        console.error('[FAIL] Could not insert command:', error.message);
        return;
    }

    const setTime = Date.now();
    const cmdId = data.id;
    console.log(`[WAITING] Command ID: ${cmdId}`);

    // Poll for result
    const interval = setInterval(async () => {
        const { data: cmd } = await supabase.from('ghost_bridge').select('*').eq('id', cmdId).single();

        if (cmd.status === 'executed') {
            clearInterval(interval);
            console.log('[SUCCESS] Vision Captured!');
            console.log(`Payload: ${cmd.output}`);
        } else if (cmd.status === 'failed') {
            clearInterval(interval);
            console.error('[FAIL] Vision Error:', cmd.output);
        } else if (Date.now() - setTime > 30000) {
            clearInterval(interval);
            console.error('[TIMEOUT] No response in 30s.');
        }
    }, 2000);
}

testVision();
