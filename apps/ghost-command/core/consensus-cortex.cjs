/**
 * Phase 49: Consensus Cortex — Collective Intelligence Engine
 * 
 * This service allows nodes to peer-review collective insights,
 * casting votes to promote patterns to "Verified" or "Universal" status.
 */

class ConsensusCortex {
    constructor(supabase, registry, swarm, config = {}) {
        this.supabase = supabase;
        this.registry = registry;
        this.swarm = swarm;
        this.config = config;
        this.instanceId = null;
        this.reviewInterval = null;
        this.quorumThreshold = 3; // Number of endorsements to verify
    }

    async start() {
        this.instanceId = this.registry.instanceId;
        if (!this.instanceId) {
            console.error('[CONSENSUS_CORTEX] Not registered. Waiting...');
            return;
        }

        console.log('🗳️ [CONSENSUS_CORTEX] Distributed Peer Review Active');

        // Initial review
        this.reviewNewInsights();

        // Review every 2 minutes
        this.reviewInterval = setInterval(() => this.reviewNewInsights(), 120000);
    }

    async reviewNewInsights() {
        try {
            // Find unverified insights NOT created by this node
            const { data: insights, error } = await this.supabase
                .from('collective_insights')
                .select('*')
                .eq('verification_status', 'unverified')
                .neq('source_instance', this.instanceId)
                .order('created_at', { ascending: true })
                .limit(5);

            if (error) throw error;

            for (const insight of (insights || [])) {
                // Check if we've already voted
                const { data: existingVote } = await this.supabase
                    .from('hive_consensus_votes')
                    .select('id')
                    .eq('insight_id', insight.id)
                    .eq('node_id', this.instanceId)
                    .maybeSingle();

                if (!existingVote) {
                    await this.evaluateInsight(insight);
                }
            }
        } catch (err) {
            console.error('[CONSENSUS_CORTEX] Review cycle failed:', err.message);
        }
    }

    async evaluateInsight(insight) {
        console.log(`[CONSENSUS_CORTEX] 🧐 Evaluating insight: ${insight.title}`);

        try {
            // Use Swarm to perform a "Peer Review" analysis
            const prompt = `PEER REVIEW REQUEST:
            TITLE: ${insight.title}
            TYPE: ${insight.insight_type}
            DESCRIPTION: ${insight.description}
            PROPOSED SOLUTION: ${insight.solution}
            
            Analyze the validity of this insight. If it is high-quality and applicable, respond with "ENDORSE". If it is redundant or incorrect, respond with "REJECT". Provide a brief 1-sentence rationale.`;

            const evaluation = await this.swarm.executeWithConsensus('Hive Peer Review', prompt);

            const voteType = evaluation.consensus.toUpperCase().includes('ENDORSE') ? 'endorse' : 'reject';
            const rationale = evaluation.consensus.substring(0, 255);

            // Cast Vote
            await this.supabase.from('hive_consensus_votes').insert([{
                insight_id: insight.id,
                node_id: this.instanceId,
                vote_type: voteType,
                rationale: rationale
            }]);

            console.log(`[CONSENSUS_CORTEX] 🗳️ Vote cast: ${voteType.toUpperCase()} for "${insight.title}"`);

            // Check if this endorsement pushes it to 'verified'
            if (voteType === 'endorse') {
                await this.updateInsightConsensus(insight.id);
            }
        } catch (err) {
            console.error(`[CONSENSUS_CORTEX] Evaluation failed for ${insight.id}:`, err.message);
        }
    }

    async updateInsightConsensus(insightId) {
        try {
            // Get all votes for this insight
            const { data: votes } = await this.supabase
                .from('hive_consensus_votes')
                .select('vote_type')
                .eq('insight_id', insightId);

            const endorsements = votes.filter(v => v.vote_type === 'endorse').length;
            const rejections = votes.filter(v => v.vote_type === 'reject').length;

            // Calculate score (simple consensus score)
            const consensusScore = endorsements / Math.max(1, endorsements + rejections);

            let status = 'unverified';
            if (endorsements >= this.quorumThreshold) {
                status = 'verified';
                console.log(`🎉 [CONSENSUS_CORTEX] Insight ${insightId} has reached QUORUM and is now VERIFIED.`);

                // Broadcast the new verified pattern
                await this.broadcastVerification(insightId);
            }

            await this.supabase
                .from('collective_insights')
                .update({
                    verification_status: status,
                    consensus_score: parseFloat(consensusScore.toFixed(2)),
                    endorsements_count: endorsements
                })
                .eq('id', insightId);

        } catch (err) {
            console.error('[CONSENSUS_CORTEX] Consensus update failed:', err.message);
        }
    }

    async broadcastVerification(insightId) {
        try {
            const { data: insight } = await this.supabase
                .from('collective_insights')
                .select('title')
                .eq('id', insightId)
                .single();

            await this.supabase.from('ghost_bridge').insert([{
                command: 'sys:broadcast',
                source: 'consensus_cortex',
                status: 'alert',
                output: JSON.stringify({
                    id: crypto.randomUUID(),
                    title: `UNIVERSAL PATTERN IDENTIFIED`,
                    message: `The Hive has reached consensus on: "${insight.title}". This pattern is now authenticated across all nodes.`,
                    type: 'synergy',
                    timestamp: Date.now()
                })
            }]);
        } catch (e) { /* ignore */ }
    }

    stop() {
        if (this.reviewInterval) clearInterval(this.reviewInterval);
    }
}

module.exports = ConsensusCortex;
