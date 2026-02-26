const http = require('http');

async function testEmbedding(text) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            model: 'nomic-embed-text',
            prompt: text
        });

        const options = {
            hostname: 'localhost',
            port: 11434,
            path: '/api/embeddings',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('Result for:', text);
                    console.log('Embedding length:', result.embedding ? result.embedding.length : 'NULL');
                    resolve(result.embedding);
                } catch (e) {
                    console.error('Parse error:', e.message);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error('API Error:', e.message);
            resolve(null);
        });
        req.write(payload);
        req.end();
    });
}

testEmbedding('Hello Matrix.').then(() => process.exit());
