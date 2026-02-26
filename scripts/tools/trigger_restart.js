const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function trigger() {
    const { data, error } = await supabase
        .from('ghost_bridge')
        .insert({
            command: 'sys:restart_all',
            status: 'pending',
            source: 'nexus_remote'
        });

    if (error) {
        console.error('DB_ERROR:', error);
        return;
    }

    console.log('RESTART_COMMAND_INSERTED');
}
trigger();
