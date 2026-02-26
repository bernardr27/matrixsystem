/**
 * Phase 49: Collective Consciousness Verification
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RegistryClient = require('../../apps/ghost-command/core/registry-client.cjs');
const ConsensusCortex = require('../../apps/ghost-command/core/consensus-cortex.cjs');

async function verifyCollectiveConsciousness() {
    console.log('🧪 Starting Phase 49: Collective Consciousness Verification...');

    try {
        // 1. Initialize Nodes
        console.log('\n📦 Initializing nodes...');
        const registryA = new RegistryClient(supabase, { instanceName: 'node-poster-insight', environment: 'test' });
        const registryB = new RegistryClient(supabase, { instanceName: 'node-consensus-reviewer', environment: 'test' });

        const idA = await registryA.register();
        const idB = await registryB.register();
        console.log(`✅ Nodes Registered: Poster(${idA}), Reviewer(${idB})`);

        // 2. Poster Node: Creates an Insight
        console.log('\n📝 Posting collective insight (Node A)...');
        const { data: insight, error: postErr } = await supabase
            .from('collective_insights')
            .insert([{
                source_instance: idA,
                insight_type: 'optimization',
                title: 'Neural Loop Frequency Adjustment',
                description: 'Adjusting periodic pulse to 15s increases telemetry stability by 22%.',
                solution: 'setInterval(pulse, 15000)',
                verification_status: 'unverified'
            }])
            .select()
            .single();

        if (postErr) throw postErr;
        console.log(`✅ Insight Posted: ${insight.id}`);

        // 3. Reviewer Node: Autonomous Evaluation & Voting
        console.log('\n🗳️ Simulating Reviewer Node (Node B) Evaluation...');
        const consensusB = new ConsensusCortex(supabase, registryB, {
            executeWithConsensus: async () => ({ consensus: 'ENDORSE: Tested local telemetry稳定性, confirm 15s is superior.' })
        });
        consensusB.instanceId = idB;
        consensusB.quorumThreshold = 1; // Lower quorum for simulation

        // Manually trigger review
        await consensusB.reviewNewInsights();

        // 4. Verification of Vote and Status
        console.log('\n🧐 Verifying consensus state transition...');
        const { data: updatedInsight } = await supabase
            .from('collective_insights')
            .select('*')
            .eq('id', insight.id)
            .single();

        if (updatedInsight.verification_status === 'verified') {
            console.log(`🏆 Consensus Verified: Insight status is ${updatedInsight.verification_status}`);
            console.log(`   Endorsements: ${updatedInsight.endorsements_count}`);
            console.log(`   Consensus Score: ${updatedInsight.consensus_score}`);
        } else {
            console.error(`❌ Consensus Failed: Insight status is ${updatedInsight.verification_status}`);
        }

        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await supabase.from('hive_consensus_votes').delete().eq('insight_id', insight.id);
        await supabase.from('collective_insights').delete().eq('id', insight.id);
        await supabase.from('matrix_instances').delete().in('id', [idA, idB]);

    } catch (err) {
        console.error('❌ Phase 49 Verification Failed:', err.message);
    }

    console.log('\n🧪 Verification Complete.');
}

verifyCollectiveConsciousness();
