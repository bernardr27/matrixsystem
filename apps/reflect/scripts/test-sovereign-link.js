const OpenAI = require('openai');

async function testSovereignLink() {
    console.log('[TEST] Initializing Sovereign Link...');

    // 1. Configuration (Matching openai.ts)
    const sovereignURL = 'http://localhost:11434/v1';
    const client = new OpenAI({
        baseURL: sovereignURL,
        apiKey: 'ollama', // Dummy key
    });
    const model = 'llama3.2:latest';

    console.log(`[TEST] Connected to ${sovereignURL}`);
    console.log(`[TEST] Target Model: ${model}`);

    try {
        // 2. Attempt Chat Completion
        const completion = await client.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: 'You are a Sovereign AI. Respond in 5 words.' },
                { role: 'user', content: 'Status report?' }
            ],
            stream: false
        });

        const reply = completion.choices[0].message.content;
        console.log('\n✅ [SUCCESS] Neural Uplink Established.');
        console.log(`🧠 AI Response: "${reply}"`);

    } catch (error) {
        console.error('\n❌ [FAILURE] Link Severed.');
        console.error('Error Details:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testSovereignLink();
