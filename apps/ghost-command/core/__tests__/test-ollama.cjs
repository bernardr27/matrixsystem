const http = require('http');

async function checkOllama() {
    console.log('--- OLLAMA HEALTH CHECK ---');

    const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/tags',
        method: 'GET',
        timeout: 2000
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                const models = JSON.parse(data);
                console.log('✅ Ollama is Reachable.');
                console.log('📦 Available Models:', models.models.map(m => m.name).join(', ') || 'None found (run ollama pull <model>)');
                process.exit(0);
            } else {
                console.error('❌ Ollama returned status:', res.statusCode);
                process.exit(1);
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Ollama Connection Failed:', e.message);
        console.log('👉 Make sure Ollama is running on localhost:11434');
        process.exit(1);
    });

    req.end();
}

checkOllama();
