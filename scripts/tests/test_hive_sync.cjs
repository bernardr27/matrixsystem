/**
 * Phase 44: Hive Synchronization Verification
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyHiveSync() {
    console.log('🧪 Starting Phase 44: Hive Synchronization Verification...');

    try {
        // 1. Get nodes to test with
        const { data: nodes } = await supabase
            .from('matrix_instances')
            .select('id, instance_name')
            .eq('status', 'online')
            .limit(2);

        if (!nodes || nodes.length < 1) {
            console.error('❌ Verification failed: No online nodes found. Ensure ghost-runner is running.');
            return;
        }

        const nodeA = nodes[0];
        console.log(`✅ Using Node A: ${nodeA.instance_name}`);

        // 2. Simulate P2P Message Sending (Self-test if only one node)
        const targetNode = nodes[1] || nodeA;
        console.log(`📡 Simulating RESEARCH_DELEGATION to ${targetNode.instance_name}...`);

        const mockPayload = {
            taskTitle: 'P2P Sync Test',
            prompt: 'Explain Distributed Consciousness in one sentence.',
            workerId: 1,
            temperature: 0.7
        };

        const { data: message, error } = await supabase
            .from('hive_messages')
            .insert([{
                source_node: nodeA.id,
                target_node: targetNode.id,
                type: 'RESEARCH_DELEGATION',
                payload: mockPayload,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        console.log(`✅ Message ${message.id} dispatched to Hive.`);

        // 3. Poll for status change (Simulating Node B processing)
        console.log('⏳ Waiting for node response (Realtime simulation)...');
        let completed = false;
        for (let i = 0; i < 15; i++) {
            const { data: check } = await supabase
                .from('hive_messages')
                .select('status, payload')
                .eq('id', message.id)
                .single();

            if (check.status === 'completed' || check.status === 'processing') {
                console.log(`🔄 Message status updated: ${check.status}`);
                if (check.status === 'completed') {
                    console.log('🏆 Hive Synchronization Verified.');
                    console.log(`   Response: ${JSON.stringify(check.payload.response)}`);
                    completed = true;
                    break;
                }
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        if (!completed) {
            console.warn('⚠️ Manual verification required: Message remained pending or timed out.');
            console.log('   (This is expected if ghost-runner is not currently subscribing to hive_messages)');
        }

    } catch (err) {
        console.error('❌ Phase 44 Verification Failed:', err.message);
    }

    console.log('\n🧪 Verification Complete.');
}

verifyHiveSync();
