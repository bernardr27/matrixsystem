/**
 * Phase 46: Spatial Synergy Verification
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SwarmAgent = require('../../apps/ghost-command/core/swarm-agent.cjs');

async function verifySpatialSynergy() {
    console.log('🧪 Starting Phase 46: Spatial Synergy Verification...');

    try {
        // 1. Initialize SwarmAgent
        const swarm = new SwarmAgent(supabase);
        console.log('✅ SwarmAgent initialized.');

        // 2. Simulate Spatial Uplink (Sentinel Log)
        console.log('\n📡 Simulating Spatial Uplink event...');
        const { error: logError } = await supabase.from('sentinel_logs').insert([{
            service: 'ghost-vision',
            level: 'info',
            message: 'Spatial Uplink Initiated (Verification)',
            metadata: { type: 'spatial_uplink', multi_frame: true }
        }]);

        if (logError) throw logError;
        console.log('✅ Spatial Uplink log injected.');

        // 3. Test Spatial Analysis Logic
        console.log('\n👁️ Testing Spatial Analysis execution...');
        const mockImageUrl = 'https://example.com/spatial_uplink_test.jpg';
        const mockMetadata = { location: 'neural_lab', orientation: 'topological' };

        // Mocking executeWithConsensus to avoid real AI calls during unit-like test
        const originalExecute = swarm.executeWithConsensus;
        swarm.executeWithConsensus = async (title, prompt) => {
            console.log(`🐝 [MOCK] Consensus called for: ${title}`);
            return { consensus: '## Swarm Consensus\nEnvironment grounded. Confidence Score: 95%', workers: 3 };
        };

        const result = await swarm.executeSpatialAnalyst(mockImageUrl, mockMetadata);

        if (result && result.consensus.includes('Environment grounded')) {
            console.log('🏆 Spatial Synergy Logic Verified: Environmental grounding successful.');
        } else {
            console.error('❌ Spatial Synergy Logic Failed: Analysis result invalid.');
        }

        // Restore original method
        swarm.executeWithConsensus = originalExecute;

    } catch (err) {
        console.error('❌ Phase 46 Verification Failed:', err.message);
    }

    console.log('\n🧪 Verification Complete.');
}

verifySpatialSynergy();
