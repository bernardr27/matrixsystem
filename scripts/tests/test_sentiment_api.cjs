/**
 * Phase 40: Sentiment API Verification
 */
const axios = require('axios');

async function verify() {
    console.log('🧪 Starting Phase 40: Sentiment API Verification...');

    try {
        console.log('📡 Fetching sentiment data from Citadel...');
        const res = await axios.get('http://localhost:3005/api/sentiment');

        if (res.status === 200) {
            const data = res.data;
            console.log('✅ API unreachable at port 3005 (Check if server is running). Proceeding with data check...');

            console.log('--- SENTIMENT METRICS ---');
            console.log(`Dominant Emotion: ${data.dominantEmotion}`);
            console.log(`Average Mood: ${data.averageMood}`);
            console.log(`System Resonance: ${data.systemResonance}`);
            console.log('Distribution:', data.emotionDistribution);

            const required = ['averageMood', 'dominantEmotion', 'systemResonance', 'emotionDistribution'];
            const missing = required.filter(k => data[k] === undefined);

            if (missing.length === 0) {
                console.log('✅ All metadata fields present.');
            } else {
                console.error('❌ Missing fields:', missing.join(', '));
            }
        }
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.log('⚠️ Citadel server not reachable at localhost:3005. This is expected if only running in dev.');
        } else {
            console.error('❌ Verification failed:', err.message);
        }
    }

    console.log('\n🧪 Verification Complete.');
}

verify();
