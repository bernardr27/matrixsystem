const path = require('path');
const fs = require('fs');

const configPath = path.join(__dirname, '..', '..', '..', 'triage.config.json');
console.log(`Resolved Config Path: ${configPath}`);

try {
    const raw = fs.readFileSync(configPath, 'utf8');
    console.log('File read success. Length:', raw.length);
    const parsed = JSON.parse(raw);
    console.log('JSON parse success. Version:', parsed.version);
} catch (e) {
    console.error('ERROR:', e.message);
}
