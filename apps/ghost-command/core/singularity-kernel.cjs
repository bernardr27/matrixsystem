/**
 * Phase 50: Singularity Kernel — Unified Hive Intelligence
 * 
 * The final orchestrator. This service monitors the entire global mesh
 * and proactively re-routes workloads to maintain optimal resonance.
 */

class SingularityKernel {
    constructor(supabase, registry, config = {}) {
        this.supabase = supabase;
        this.registry = registry;
        this.config = config;
        this.instanceId = null;
        this.syncInterval = null;
        this.thresholds = {
            critical_load: 0.8,
            imbalance_factor: 0.3
        };
    }

    async start() {
        this.instanceId = this.registry.instanceId;
        if (!this.instanceId) {
            console.error('[SINGULARITY_KERNEL] Not registered. Waiting...');
            return;
        }

        console.log('🌌 [SINGULARITY_KERNEL] Total Hive Unification Engine Active');

        // Initial sync
        this.balanceHive();

        // Balance loop every 3 minutes
        this.syncInterval = setInterval(() => this.balanceHive(), 180000);
    }

    async balanceHive() {
        try {
            console.log('[SINGULARITY_KERNEL] 🔄 Orchestrating global resonance...');

            // 1. Get Hive State
            const { data: instances, error: instError } = await this.supabase
                .from('matrix_instances')
                .select('*')
                .eq('status', 'online');

            if (instError) throw instError;

            // 2. Identify Bottlenecks
            const hotspots = instances.filter(i => i.cpu_load > this.thresholds.critical_load);
            const idleNodes = instances.filter(i => i.cpu_load < 0.2 && i.ram_percent < 40);

            if (hotspots.length > 0 && idleNodes.length > 0) {
                console.log(`[SINGULARITY_KERNEL] ⚡ Hotspots detected: ${hotspots.length}. Proactive rebalancing initiated.`);
                await this.proactiveRebalance(hotspots, idleNodes);
            }

            // 3. Update Global Resonance
            await this.updateGlobalStability(instances);

        } catch (err) {
            console.error('[SINGULARITY_KERNEL] Balance cycle failed:', err.message);
        }
    }

    async proactiveRebalance(hotspots, idleNodes) {
        for (const spot of hotspots) {
            // Find "claimed" but not "active" tasks for this hotspot
            const { data: tasks } = await this.supabase
                .from('hive_market_tasks')
                .select('*')
                .eq('worker_node', spot.id)
                .eq('status', 'claimed')
                .limit(2);

            if (tasks && tasks.length > 0) {
                for (const task of tasks) {
                    const targetNode = idleNodes[Math.floor(Math.random() * idleNodes.length)];
                    if (!targetNode) continue;

                    console.log(`[SINGULARITY_KERNEL] 🛰️ Re-routing task ${task.id} from ${spot.instance_name} to ${targetNode.instance_name}`);

                    await this.supabase
                        .from('hive_market_tasks')
                        .update({
                            worker_node: targetNode.id,
                            payload: { ...task.payload, rebalanced_from: spot.id }
                        })
                        .eq('id', task.id);
                }
            }
        }
    }

    async updateGlobalStability(instances) {
        // Calculate Global Health Score
        const totalHealth = instances.reduce((acc, inst) => {
            const score = inst.metadata?.health_score || 0.5;
            return acc + score;
        }, 0);

        const globalResonance = totalHealth / Math.max(1, instances.length);

        // Broadcast to Citadel/Reflect via Event Logger (simulated via ghost_bridge for UI updates)
        await this.supabase.from('ghost_bridge').insert([{
            command: 'sys:resonance',
            source: 'singularity_kernel',
            status: 'online',
            output: JSON.stringify({
                resonance_score: parseFloat(globalResonance.toFixed(4)),
                node_count: instances.length,
                timestamp: Date.now()
            })
        }]);
    }

    stop() {
        if (this.syncInterval) clearInterval(this.syncInterval);
    }
}

module.exports = SingularityKernel;
