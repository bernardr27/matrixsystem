const { createClient } = require('@supabase/supabase-js');

// Use the cleaned key that we know works
const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM'.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBridge() {
    console.log('--- BRIDGE AUDIT ---');

    // 1. Check for stuck pending commands
    const { data: pending, error: pendingError } = await supabase
        .from('ghost_bridge')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

    if (pendingError) console.error('Pending Error:', pendingError);
    else {
        console.log(`Pending Commands (${pending.length}):`);
        pending.forEach(c => console.log(`- [${c.created_at}] ${c.command} (Source: ${c.source})`));
    }

    // 2. Check recent heartbeats
    const { data: hearts, error: heartError } = await supabase
        .from('ghost_bridge')
        .select('*')
        .eq('command', 'sys:heartbeat')
        .order('created_at', { ascending: false })
        .limit(3);

    if (heartError) console.error('Heartbeat Error:', heartError);
    else {
        console.log(`\nRecent Heartbeats (${hearts.length}):`);
        hearts.forEach(c => {
            console.log(`- [${c.created_at}] Source: ${c.source}`);
            console.log(c.output); // Print FULL output
        });
    }
}

checkBridge();
