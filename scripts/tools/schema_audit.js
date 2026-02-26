const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Auditing ghost_bridge schema...');
    // We can't directly query schema via JS client easily, but we can try to insert a dummy row with all columns we expect
    const { error } = await supabase.from('ghost_bridge').insert({
        command: 'test',
        source: 'audit',
        status: 'test',
        output: 'test',
        executed: false
    });

    if (error) {
        console.log('Error detail:', JSON.stringify(error, null, 2));
    } else {
        console.log('Insert success. All columns present.');
    }
}

checkSchema();
