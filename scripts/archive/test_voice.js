const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM'.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function testVoice() {
    console.log("Dispatching Voice Command...");
    const { error } = await supabase.from('ghost_bridge').insert({
        command: 'sage:speak Initializing Ghost Hand protocols. Systems active.',
        source: 'nexus_dashboard',
        status: 'pending'
    });
    if (error) console.error("Error:", error);
    else console.log("Command sent!");
}

testVoice();
