const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM'.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('matrix_diagnostics').select('*').order('created_at', { ascending: false }).limit(5);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('--- DIAGNOSTICS ---');
        console.log(JSON.stringify(data, null, 2));
    }
}
check();
