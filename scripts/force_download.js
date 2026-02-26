/**
 * Force Download - Fetches specific files from Supabase regardless of status
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function downloadLatestFiles(count = 5) {
    console.log(`⬇️  Downloading latest ${count} files from ghost-storage/transfers...\n`);

    const { data: files, error } = await supabase.storage
        .from('ghost-storage')
        .list('transfers', { limit: count, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    for (const file of files) {
        const remotePath = `transfers/${file.name}`;
        console.log(`📥 ${file.name}...`);

        try {
            const { data, error: dlError } = await supabase.storage
                .from('ghost-storage')
                .download(remotePath);

            if (dlError) throw dlError;

            const buffer = Buffer.from(await data.arrayBuffer());
            const localPath = path.join(UPLOADS_DIR, file.name);
            fs.writeFileSync(localPath, buffer);
            console.log(`   ✅ Saved: ${localPath}`);
        } catch (err) {
            console.error(`   ❌ Failed: ${err.message}`);
        }
    }

    console.log('\n✨ Done! Check g:\\matrix\\uploads');
}

downloadLatestFiles(3);
