const fs = require('fs');
const path = require('path');
const { createSupabaseFromEnv } = require('./tools/_supabase_client.cjs');

const supabase = createSupabaseFromEnv();

const FILES = [
    'transfers/1770790792980_IMG_0672.png',
    'transfers/1770790791922_IMG_0673.png'
];

async function downloadFiles() {
    console.log('Downloading failed transfers...');
    const downloadDir = path.join(__dirname, '../downloads');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

    for (const file of FILES) {
        console.log(`Fetching ${file}...`);
        const { data, error } = await supabase.storage.from('ghost-storage').download(file);
        if (error) {
            console.error(`Failed to download ${file}:`, error);
            continue;
        }
        const buffer = Buffer.from(await data.arrayBuffer());
        const fileName = file.split('/').pop();
        const localPath = path.join(downloadDir, fileName);
        fs.writeFileSync(localPath, buffer);
        console.log(`Saved to ${localPath}`);
    }
}

downloadFiles();
