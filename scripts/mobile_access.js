const os = require('os');
const qrcode = require('qrcode-terminal');

function getLocalIP() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        for (const netInterface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (netInterface.family === 'IPv4' && !netInterface.internal) {
                return netInterface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();
const port = 3001;
const url = `http://${localIP}:${port}`;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║          NEXUS MOBILE ACCESS - LOCAL NETWORK              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📱 Access Nexus from your phone:\n');
console.log(`   URL: ${url}`);
console.log(`   Local IP: ${localIP}`);
console.log(`   Port: ${port}\n`);

console.log('🔗 Scan this QR code with your phone:\n');
qrcode.generate(url, { small: true });

console.log('\n📋 Setup Instructions:\n');
console.log('1. Make sure your phone is on the SAME WiFi network');
console.log('2. Start Nexus with: npm run dev (already configured for port 3001)');
console.log('3. Scan the QR code above OR type the URL manually');
console.log('4. The Nexus dashboard will load on your phone\n');

console.log('⚠️  Troubleshooting:\n');
console.log('- Firewall: Windows may block port 3000 (allow Node.js)');
console.log('- Network: Phone and PC must be on same WiFi');
console.log('- IP Changed: Re-run this script to get updated QR code\n');

console.log('═'.repeat(60) + '\n');
