const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const key = process.argv[2];
const value = process.argv[3];

if (!key || !value) {
    console.error('Usage: node update-env.cjs <KEY> <VALUE>');
    process.exit(1);
}

if (!fs.existsSync(envPath)) {
    console.error('.env not found at', envPath);
    process.exit(1);
}

let content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');
let replaced = false;

const newLines = lines.map(line => {
    if (line.startsWith(`${key}=`)) {
        replaced = true;
        return `${key}=${value}`;
    }
    return line;
});

if (!replaced) {
    newLines.push(`${key}=${value}`);
}

fs.writeFileSync(envPath, newLines.join('\n'));
console.log(`Successfully updated ${key} to ${value}`);
