/**
 * API Test for Swarm Research (Rocket Command)
 */

async function testSwarmResearch() {
    console.log('🚀 Testing Swarm Research API...');

    try {
        const response = await fetch('http://localhost:4000/api/swarm-research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: 'Future of Decentralized AGI Orchestration',
                depth: 'shallow'
            })
        });

        if (!response.ok) {
            console.error('❌ API Error:', response.status, await response.text());
            return;
        }

        console.log('📡 Stream started. Processing phases...\n');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.substring(6));
                    if (data.phase) {
                        console.log(`🔷 [PHASE: ${data.phase.toUpperCase()}] ${data.message || ''}`);
                    }
                    if (data.phase === 'complete') {
                        console.log('\n✅ Research Complete!');
                        console.log('Report Length:', data.report.length);
                        console.log('PRD Length:', data.prd.length);
                    }
                }
            }
        }
    } catch (e) {
        console.error('❌ Fetch failed:', e.message);
    }
}

testSwarmResearch();
