/**
 * Phase 47: Global Synthesis (Planetary Mesh) Verification
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RegistryClient = require('../../apps/ghost-command/core/registry-client.cjs');
const HiveMessenger = require('../../apps/ghost-command/core/hive-messenger.cjs');

async function verifyPlanetaryMesh() {
    console.log('🧪 Starting Phase 47: Planetary Mesh Verification...');

    try {
        // 1. Initialize Registry and Messenger
        const registry = new RegistryClient(supabase, {
            instanceName: 'test-node-alpha',
            environment: 'test'
        });

        // Mocking ENV for Geographic Detection
        process.env.MATRIX_REGION = 'europe-west1';
        process.env.MATRIX_PROVIDER = 'digital-ocean';

        console.log('\n🌍 Registering node with geographic metadata...');
        const instanceId = await registry.register();
        console.log(`✅ Node Registered: ${instanceId} | Region: europe-west1`);

        // 2. Test Mesh Summary Aggregation
        console.log('\n📊 Testing Regional Aggregation...');
        const summary = await registry.getGlobalMeshSummary();
        console.log('✅ Mesh Summary:', JSON.stringify(summary, null, 2));

        if (summary.regional_distribution['europe-west1'] >= 1) {
            console.log('🏆 Aggregation Verified: Regional node correctly counted.');
        } else {
            console.error('❌ Aggregation Failed: Node not found in regional distribution.');
        }

        // 3. Test Broadcast Protocol
        console.log('\n📡 Testing Broadcast Protocol...');
        const messenger = new HiveMessenger(supabase, registry);
        messenger.instanceId = instanceId; // Manually setting since we don't want to start() full subscription logic here

        const broadcastId = await messenger.broadcast('GLOBAL_SYNC_TEST', { message: 'Planet-scale coordination active.' });
        console.log(`✅ Broadcast Sent: ${broadcastId}`);

        // Verify broadcast in DB (target_node should be null)
        const { data: message } = await supabase
            .from('hive_messages')
            .select('*')
            .eq('id', broadcastId)
            .single();

        if (message && message.target_node === null) {
            console.log('🏆 Broadcast Verified: Target node correctly set to NULL.');
        } else {
            console.error('❌ Broadcast Failed: message record invalid.');
        }

        // Cleanup test node
        console.log('\n🧹 Cleaning up...');
        await supabase.from('matrix_instances').delete().eq('id', instanceId);

    } catch (err) {
        console.error('❌ Phase 47 Verification Failed:', err.message);
    }

    console.log('\n🧪 Verification Complete.');
}

verifyPlanetaryMesh();
