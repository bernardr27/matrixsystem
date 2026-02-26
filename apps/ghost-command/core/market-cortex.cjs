/**
 * Phase 48: Market Cortex — Autonomous Economy Engine
 * 
 * This service allows the node to participate in the decentralized
 * hive market by bidding on tasks based on local resource availability.
 */

class MarketCortex {
    constructor(supabase, registry, swarm, config = {}) {
        this.supabase = supabase;
        this.registry = registry;
        this.swarm = swarm;
        this.config = config;
        this.instanceId = null;
        this.activeTask = null;
        this.scanInterval = null;
        this.thresholds = {
            cpu: 0.4,    // Max CPU load to accept tasks
            ram: 60,     // Max RAM percent to accept tasks
            health: 0.7  // Min health score to accept tasks
        };
    }

    async start() {
        this.instanceId = this.registry.instanceId;
        if (!this.instanceId) {
            console.error('[MARKET_CORTEX] Not registered. Waiting...');
            return;
        }

        console.log('📈 [MARKET_CORTEX] Autonomous Resource Trading Active');

        // Initial scan
        this.scanMarket();

        // Scan every 30 seconds
        this.scanInterval = setInterval(() => this.scanMarket(), 30000);
    }

    async scanMarket() {
        if (this.activeTask) return;

        try {
            // Check local health before bidding
            const metrics = this.registry.getSystemMetrics ? this.registry.getSystemMetrics() : await this.getQuickMetrics();
            if (metrics.cpuLoad > this.thresholds.cpu || metrics.ramPercent > this.thresholds.ram) {
                return; // Too busy to take more work
            }

            // Look for open tasks
            const { data: openTasks, error } = await this.supabase
                .from('hive_market_tasks')
                .select('*')
                .eq('status', 'open')
                .neq('poster_node', this.instanceId)
                .order('reward_points', { ascending: false })
                .limit(1);

            if (openTasks && openTasks.length > 0) {
                await this.bidOnTask(openTasks[0]);
            }
        } catch (err) {
            console.error('[MARKET_CORTEX] Market scan failed:', err.message);
        }
    }

    async getQuickMetrics() {
        // Fallback if registry doesn't expose metrics getter
        const os = require('os');
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        return {
            cpuLoad: os.loadavg()[0],
            ramPercent: ((totalMem - freeMem) / totalMem * 100)
        };
    }

    async bidOnTask(task) {
        console.log(`[MARKET_CORTEX] ⚖️ Bidding on task: ${task.task_title} (${task.reward_points} pts)`);

        try {
            // Optimistic claim
            const { data, error } = await this.supabase
                .from('hive_market_tasks')
                .update({
                    worker_node: this.instanceId,
                    status: 'claimed',
                    claimed_at: new Date().toISOString()
                })
                .eq('id', task.id)
                .eq('status', 'open') // Ensure it's still open
                .select()
                .single();

            if (data) {
                this.activeTask = data;
                console.log(`[MARKET_CORTEX] ✅ Task secured. Initiating execution...`);
                this.executeTask(data);
            }
        } catch (err) {
            console.error('[MARKET_CORTEX] Bid failed:', err.message);
        }
    }

    async executeTask(task) {
        try {
            // Update status to active
            await this.supabase.from('hive_market_tasks').update({ status: 'active' }).eq('id', task.id);

            console.log(`[MARKET_CORTEX] 🐝 Executing ${task.task_type}: ${task.task_title}`);

            let result;
            if (task.task_type === 'vision_scan') {
                // Bridge to Swarm's spatial analyst
                result = await this.swarm.executeSpatialAnalyst(task.task_prompt, task.payload || {});
            } else {
                // Bridge to Swarm consensus
                result = await this.swarm.executeWithConsensus(task.task_title, task.task_prompt);
            }

            // Finalize task
            await this.supabase.from('hive_market_tasks').update({
                status: 'completed',
                result: JSON.stringify(result),
                completed_at: new Date().toISOString()
            }).eq('id', task.id);

            // Reward nodes (Future expansion: update market_credits)

            console.log(`[MARKET_CORTEX] 🏆 Task completed: ${task.task_title}`);
            this.activeTask = null;
        } catch (err) {
            console.error('[MARKET_CORTEX] Task execution failed:', err.message);
            await this.supabase.from('hive_market_tasks').update({
                status: 'failed',
                result: JSON.stringify({ error: err.message })
            }).eq('id', task.id);
            this.activeTask = null;
        }
    }

    stop() {
        if (this.scanInterval) clearInterval(this.scanInterval);
    }
}

module.exports = MarketCortex;
