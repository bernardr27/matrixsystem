
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHeartbeats() {
    console.log('--- RECENT HEARTBEAT AUDIT ---');
    const { data, error } = await supabase
        .from('ghost_bridge')
        .select('*')
        .eq('command', 'sys:heartbeat')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Failed to fetch heartbeats:', error);
        return;
    }

    data.forEach(h => {
        console.log(`[${h.created_at}] Source: ${h.source}`);
        try {
            const output = JSON.parse(h.output);
            console.log('Services:', JSON.stringify(output.services, null, 2));
        } catch (e) {
            console.log('Raw Output:', h.output);
        }
        console.log('---');
    });
}

checkHeartbeats();
