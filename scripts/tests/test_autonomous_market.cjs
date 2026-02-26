/**
 * Phase 48: Autonomous Market & Resource Hive Verification
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RegistryClient = require('../../apps/ghost-command/core/registry-client.cjs');
const MarketCortex = require('../../apps/ghost-command/core/market-cortex.cjs');

async function verifyAutonomousMarket() {
    console.log('🧪 Starting Phase 48: Autonomous Market Verification...');

    try {
        // 1. Initialize Nodes
        console.log('\n📦 Initializing nodes...');
        const registryA = new RegistryClient(supabase, { instanceName: 'node-poster', environment: 'test' });
        const registryB = new RegistryClient(supabase, { instanceName: 'node-worker', environment: 'test' });

        const idA = await registryA.register();
        const idB = await registryB.register();
        console.log(`✅ Nodes Registered: Poster(${idA}), Worker(${idB})`);

        // 2. Poster Node: Creates a Task
        console.log('\n📝 Posting market task (Node A)...');
        const { data: task, error: postErr } = await supabase
            .from('hive_market_tasks')
            .insert([{
                poster_node: idA,
                task_type: 'research',
                task_title: 'Planetary Mesh Optimization',
                task_prompt: 'Analyze regional node distribution and suggest efficiency tweaks.',
                reward_points: 50
            }])
            .select()
            .single();

        if (postErr) throw postErr;
        console.log(`✅ Task Posted: ${task.id}`);

        // 3. Worker Node: Autonomous Discovery & Claiming
        console.log('\n⚖️ Simulating Worker Node (Node B) Discovery...');
        const marketB = new MarketCortex(supabase, registryB, {
            executeWithConsensus: async () => ({ consensus: 'Simulation result: Optimization suggested.' })
        });
        marketB.instanceId = idB;

        // Manually trigger scan (scanMarket checks if busy, then claims)
        await marketB.scanMarket();

        // 4. Verification of State Transition
        console.log('\n🧐 Verifying task state transition...');
        const { data: updatedTask } = await supabase
            .from('hive_market_tasks')
            .select('*')
            .eq('id', task.id)
            .single();

        if (updatedTask.status === 'claimed' || updatedTask.status === 'active' || updatedTask.status === 'completed') {
            console.log(`🏆 Market Cycle Verified: Task state is ${updatedTask.status}`);
            console.log(`   Worker Node set to: ${updatedTask.worker_node}`);
        } else {
            console.error(`❌ Market Cycle Failed: Task status is ${updatedTask.status}`);
        }

        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await supabase.from('hive_market_tasks').delete().eq('id', task.id);
        await supabase.from('matrix_instances').delete().in('id', [idA, idB]);

    } catch (err) {
        console.error('❌ Phase 48 Verification Failed:', err.message);
    }

    console.log('\n🧪 Verification Complete.');
}

verifyAutonomousMarket();
