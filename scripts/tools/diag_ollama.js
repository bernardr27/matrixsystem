
const config = {
    ollama: {
        url: 'http://127.0.0.1:11434',
        chatModel: 'llama3.2:latest'
    }
};

async function testChat() {
    console.log(`Testing Ollama at ${config.ollama.url}/api/chat...`);
    try {
        const response = await fetch(`${config.ollama.url}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.ollama.chatModel,
                messages: [{ role: 'user', content: 'hi' }],
                stream: false
            })
        });

        if (!response.ok) {
            console.error('Response NOT OK:', response.status, response.statusText);
            const text = await response.text();
            console.error('Body:', text);
        } else {
            const data = await response.json();
            console.log('Success!', JSON.stringify(data.message));
        }
    } catch (e) {
        console.error('Fetch Failed:', e.message);
        console.error('Full Error:', e);
    }
}

testChat();
