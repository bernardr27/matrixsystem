const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..'); // g:\matrix

function testList(arg) {
    console.log(`\n--- Testing fs:list with arg: "${arg}" ---`);
    try {
        const targetPath = arg ? path.resolve(ROOT_DIR, arg) : ROOT_DIR;
        console.log(`Resolved Path: ${targetPath}`);

        const items = fs.readdirSync(targetPath, { withFileTypes: true });
        console.log(`Success! Found ${items.length} items.`);
        return true;
    } catch (err) {
        console.error(`ERROR: ${err.message}`);
        return false;
    }
}

// Test cases mimicking what frontend might send
testList('./');
testList('.');
testList('apps/ghost-command');
testList('apps\\ghost-command'); // Windows style
testList('"./"'); // Potential issue if quotes are passed
testList('');
