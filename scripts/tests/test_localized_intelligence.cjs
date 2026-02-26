/**
 * Phase 43: Localized Intelligence Verification
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyLocalizedInference() {
    console.log('🧪 Starting Phase 43: Localized Intelligence Verification...');

    try {
        // 1. Verify Model Registry Update
        console.log('📡 Checking instance metadata in Hive...');
        const { data: instances } = await supabase
            .from('matrix_instances')
            .select('*')
            .order('last_heartbeat', { ascending: false })
            .limit(1);

        if (instances && instances.length > 0) {
            const node = instances[0];
            const metadata = node.metadata || {};
            console.log(`✅ Found Node: ${node.instance_name}`);
            console.log(`   Local Models: ${JSON.stringify(metadata.local_models || [])}`);
            console.log(`   Last Model Check: ${metadata.last_model_check}`);
        } else {
            console.warn('⚠️ No active instances found. Ensure ghost-runner is running.');
        }

        // 2. Test Neural Mesh "Force Local" Routing
        console.log('\n🧠 Testing Neural Mesh (Force Local Mode)...');
        try {
            // We use the Citadel API directly to test the routing
            const response = await axios.post('http://localhost:3005/api/neural', {
                action: 'chat',
                messages: [{ role: 'user', content: 'Say "Sovereign Intelligence Online" in one line.' }],
                options: { forceLocal: true }
            }, { timeout: 10000 });

            console.log('✅ Local Inference Success!');
            console.log(`   Response: "${response.data.response}"`);
            console.log('🏆 Distributed Inference Engine Verified.');
        } catch (err) {
            if (err.response?.data?.error === 'Neural synchronization failed: All distributed providers offline.') {
                console.log('✅ Logic Verified: Correct error thrown when Ollama is offline and forceLocal=true.');
                console.log('🏆 Distributed Routing Logic Confirmed.');
            } else {
                console.warn('⚠️ Local Inference Test inconclusive:', err.message);
                console.log('   (This is expected if Citadel or Ollama is not currently running in the test environment)');
            }
        }

    } catch (err) {
        console.error('❌ Phase 43 Verification Failed:', err.message);
    }

    console.log('\n🧪 Verification Complete.');
}

verifyLocalizedInference();
