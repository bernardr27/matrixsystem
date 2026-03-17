const { createSupabaseFromEnv } = require('./tools/_supabase_client.cjs');
const supabase = createSupabaseFromEnv();

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
