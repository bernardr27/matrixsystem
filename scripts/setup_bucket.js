const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
// Using the service role key if available, otherwise trying with anon (likely to fail for bucket creation)
// Actually, I only have the anon key. 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    console.log('[SETUP] Creating "ghost-storage" bucket...');

    // Attempt 1: Create Bucket (Public)
    const { data, error } = await supabase.storage.createBucket('ghost-storage', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'application/json', 'text/plain']
    });

    if (error) {
        console.error('[FAIL] Creation Error:', error.message);
        // Maybe it exists but I can't see it?
    } else {
        console.log('[SUCCESS] Bucket created:', data);
    }
}

createBucket();
