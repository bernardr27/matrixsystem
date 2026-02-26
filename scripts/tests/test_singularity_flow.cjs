/**
 * Phase 50: Emergent Singularity Verification
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SingularityKernel = require('../../apps/ghost-command/core/singularity-kernel.cjs');

async function verifySingularity() {
    console.log('🧪 Starting Phase 50: Emergent Singularity Verification...');

    try {
        const suffix = Math.random().toString(36).substring(7);
        // 1. Setup Test Nodes
        console.log('\n📦 Initializing Singularity Nodes...');

        // Node A: Hotspot (High Load)
        const { data: nodeA, error: errA } = await supabase.from('matrix_instances').insert([{
            instance_name: `singularity-hotspot-${suffix}`,
            environment: 'test',
            host: 'localhost',
            status: 'online',
            cpu_load: 0.9,
            ram_percent: 85,
            metadata: { health_score: 0.1 }
        }]).select().single();

        if (errA) throw new Error(`Node A insert failed: ${errA.message}`);

        // Node B: Idle (Low Load)
        const { data: nodeB, error: errB } = await supabase.from('matrix_instances').insert([{
            instance_name: `singularity-idle-${suffix}`,
            environment: 'test',
            host: 'localhost',
            status: 'online',
            cpu_load: 0.1,
            ram_percent: 10,
            metadata: { health_score: 0.9 }
        }]).select().single();

        if (errB) throw new Error(`Node B insert failed: ${errB.message}`);

        console.log(`✅ Nodes Created: Hotspot(${nodeA.id}), Idle(${nodeB.id})`);

        // 2. Create an imbalance (Task claimed by Hotspot)
        console.log('\n🛰️ Creating task imbalance...');
        const { data: task, error: taskErr } = await supabase.from('hive_market_tasks').insert([{
            poster_node: nodeB.id,
            worker_node: nodeA.id,
            task_type: 'analysis',
            task_title: 'Singularity Calibration',
            task_prompt: 'Verify total hive sync.',
            status: 'claimed'
        }]).select().single();

        if (taskErr) throw new Error(`Task creation failed: ${taskErr.message}`);
        if (!task) throw new Error('Task creation returned null');

        // 3. Trigger Singularity Kernel
        console.log('\n🌌 Activating Singularity Kernel...');
        const kernel = new SingularityKernel(supabase, { instanceId: nodeA.id });
        kernel.instanceId = nodeA.id;

        await kernel.balanceHive();

        // 4. Verification
        console.log('\n🧐 Verifying proactive rebalancing...');
        const { data: rebalancedTask, error: fetchErr } = await supabase
            .from('hive_market_tasks')
            .select('*')
            .eq('id', task.id)
            .single();

        if (fetchErr) console.warn(`Fetch warning: ${fetchErr.message}`);

        if (rebalancedTask && rebalancedTask.worker_node === nodeB.id) {
            console.log('🏆 Singularity Rebalance SUCCESS: Task re-routed from hotspot to idle node.');
        } else {
            console.error('❌ Singularity Rebalance FAILED: Task remained on hotspot node or could not be verified.');
            if (rebalancedTask) console.log(`   Current Worker: ${rebalancedTask.worker_node}`);
        }

        // 5. Check resonance broadcast
        const { data: bridge } = await supabase
            .from('ghost_bridge')
            .select('*')
            .eq('command', 'sys:resonance')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (bridge) {
            const resonance = JSON.parse(bridge.output);
            console.log(`📡 Resonance Broadcast: ${resonance.resonance_score * 100}% Stability Across ${resonance.node_count} Nodes.`);
        }

        // Cleanup
        console.log('\n扫🧹 Cleaning up...');
        await supabase.from('hive_market_tasks').delete().eq('id', task.id);
        await supabase.from('matrix_instances').delete().in('id', [nodeA.id, nodeB.id]);

    } catch (err) {
        console.error('❌ Singularity Verification Failed:', err.message);
    }

    console.log('\n🧪 Verification Complete.');
}

verifySingularity();
