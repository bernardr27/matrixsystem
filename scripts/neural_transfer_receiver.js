/**
 * Neural Transfer Receiver
 * Downloads files from Supabase ghost-storage to local g:\matrix\uploads
 * Run this to fetch any pending transfers
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function fetchPendingTransfers() {
    console.log('🔍 Checking for pending Neural Transfer downloads...\n');

    // Get pending download commands from ghost_bridge
    const { data: commands, error } = await supabase
        .from('ghost_bridge')
        .select('id, command, created_at')
        .like('command', 'download%')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching commands:', error.message);
        return;
    }

    if (!commands || commands.length === 0) {
        console.log('📭 No pending transfers found.');
        return;
    }

    console.log(`📦 Found ${commands.length} pending transfer(s)\n`);

    for (const cmd of commands) {
        const filePath = cmd.command.replace('download ', '').trim();
        console.log(`⬇️  Downloading: ${filePath}`);

        try {
            // Download from Supabase storage
            const { data, error: downloadError } = await supabase.storage
                .from('ghost-storage')
                .download(filePath);

            if (downloadError) throw downloadError;

            // Convert to buffer and save locally
            const buffer = Buffer.from(await data.arrayBuffer());
            const fileName = path.basename(filePath);
            const localPath = path.join(UPLOADS_DIR, fileName);

            fs.writeFileSync(localPath, buffer);
            console.log(`✅ Saved to: ${localPath}`);

            // Mark command as completed
            await supabase
                .from('ghost_bridge')
                .update({ status: 'completed' })
                .eq('id', cmd.id);

        } catch (err) {
            console.error(`❌ Failed to download ${filePath}:`, err.message);

            // Mark as failed
            await supabase
                .from('ghost_bridge')
                .update({ status: 'failed' })
                .eq('id', cmd.id);
        }
    }

    console.log('\n✨ Transfer sync complete!');
    console.log(`📁 Files saved to: ${UPLOADS_DIR}`);
}

// Also list all files in ghost-storage/transfers
async function listAvailableFiles() {
    console.log('\n📋 Files in ghost-storage/transfers:\n');

    const { data, error } = await supabase.storage
        .from('ghost-storage')
        .list('transfers', { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
        console.error('Error listing files:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('   (no files found)');
        return;
    }

    data.forEach(file => {
        console.log(`   📄 ${file.name} (${(file.metadata?.size / 1024).toFixed(1) || '?'} KB)`);
    });
}

async function main() {
    console.log('═'.repeat(50));
    console.log('     NEURAL TRANSFER RECEIVER');
    console.log('═'.repeat(50) + '\n');

    await fetchPendingTransfers();
    await listAvailableFiles();
}

main().catch(console.error);
