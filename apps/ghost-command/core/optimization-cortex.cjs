const os = require('os');
const { createClient } = require('@supabase/supabase-js');

class OptimizationCortex {
    constructor(supabase, config, integrationHub = null) {
        this.supabase = supabase;
        this.config = config;
        this.integrationHub = integrationHub;
        this.lastOptimization = 0;
        this.optimizationHistory = [];
        this.thresholds = {
            cpu: 85,  // Trigger at 85% CPU
            ram: 90,  // Trigger at 90% RAM
            cooldown: 300000  // 5 min cooldown between optimizations
        };
    }

    async analyze() {
        const metrics = this.getSystemMetrics();

        // Check if optimization is needed
        if (metrics.ramPercent > this.thresholds.ram) {
            await this.triggerOptimization('memory', metrics);
        } else if (metrics.cpuLoad > this.thresholds.cpu / 100) {
            await this.triggerOptimization('cpu', metrics);
        }
    }

    getSystemMetrics() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const ramPercent = ((totalMem - freeMem) / totalMem * 100);
        const cpuLoad = os.loadavg()[0];  // 1-minute load average

        return {
            ramPercent: ramPercent.toFixed(1),
            ramFree: (freeMem / 1024 / 1024 / 1024).toFixed(1),
            cpuLoad: cpuLoad.toFixed(2),
            uptime: (process.uptime() / 60).toFixed(0)
        };
    }

    async triggerOptimization(type, metrics) {
        const now = Date.now();

        // Cooldown check
        if (now - this.lastOptimization < this.thresholds.cooldown) {
            console.log(`[CORTEX] Optimization on cooldown (${Math.floor((this.thresholds.cooldown - (now - this.lastOptimization)) / 1000)}s remaining)`);
            return;
        }

        this.lastOptimization = now;

        console.log(`[CORTEX] 🔥 Triggering ${type.toUpperCase()} optimization...`);
        console.log(`[CORTEX] Metrics: RAM=${metrics.ramPercent}%, CPU=${metrics.cpuLoad}`);

        // Check collective insights first
        try {
            const { data: insights } = await this.supabase
                .from('collective_insights')
                .select('*')
                .eq('insight_type', 'optimization')
                .gte('effectiveness_score', 0.7)
                .order('effectiveness_score', { ascending: false })
                .limit(3);

            if (insights && insights.length > 0) {
                console.log(`[CORTEX] 🌐 Found ${insights.length} collective insight(s) for ${type} optimization`);

                // Use the most effective collective solution
                const bestInsight = insights[0];
                if (bestInsight.solution) {
                    console.log(`[CORTEX] 💡 Applying collective solution: ${bestInsight.title}`);

                    await this.supabase.from('ghost_bridge').insert([{
                        command: `sage:script ${bestInsight.solution}`,
                        source: 'optimization_cortex_collective',
                        status: 'pending',
                        metadata: JSON.stringify({ insight_id: bestInsight.id })
                    }]);

                    // Record usage
                    await this.supabase
                        .from('collective_insights')
                        .update({ times_applied: (bestInsight.times_applied || 0) + 1 })
                        .eq('id', bestInsight.id);

                    return;
                }
            }
        } catch (err) {
            console.log('[CORTEX] Could not check collective insights, generating new solution');
        }

        // Generate optimization prompt for Sage
        let prompt = '';
        if (type === 'memory') {
            prompt = `CRITICAL: RAM usage at ${metrics.ramPercent}%. Generate a PowerShell script to identify and terminate the top 3 memory-consuming idle processes (exclude system-critical processes). Return ONLY the script.`;
        } else if (type === 'cpu') {
            prompt = `CRITICAL: CPU load at ${metrics.cpuLoad}. Generate a PowerShell script to list processes using >20% CPU and suggest optimization. Return ONLY the script.`;
        }

        try {
            // Dispatch to Sage for script generation
            const { data, error } = await this.supabase.from('ghost_bridge').insert([{
                command: `sage:script ${prompt}`,
                source: 'optimization_cortex',
                status: 'pending'
            }]).select().single();

            if (error) throw error;

            // Log the optimization attempt
            this.optimizationHistory.push({
                timestamp: now,
                type,
                metrics,
                commandId: data.id
            });

            // Broadcast the autonomous action
            await this.supabase.from('ghost_bridge').insert([{
                command: 'sys:broadcast',
                source: 'optimization_cortex',
                status: 'alert',
                output: JSON.stringify({
                    id: crypto.randomUUID(),
                    title: `AUTO-OPTIMIZATION: ${type.toUpperCase()}`,
                    message: `Sage initiated ${type} optimization (${metrics.ramPercent}% RAM, ${metrics.cpuLoad} CPU load)`,
                    type: 'optimization',
                    timestamp: now
                })
            }]);

            // Send external notifications if integration hub available
            if (this.integrationHub) {
                const severity = metrics.ramPercent > 95 || metrics.cpuLoad > 0.95 ? 'critical' : 'warning';
                this.integrationHub.notify('slack', `🔥 Auto-Optimization Triggered`, {
                    severity,
                    title: `${type.toUpperCase()} Optimization`,
                    fields: [
                        { title: 'RAM Usage', value: `${metrics.ramPercent}%`, short: true },
                        { title: 'CPU Load', value: metrics.cpuLoad, short: true },
                        { title: 'Status', value: 'Sage generating optimization script...', short: false }
                    ]
                }).catch(err => console.log('[CORTEX] Failed to send notification:', err.message));
            }

            console.log(`[CORTEX] ✅ Optimization dispatched (ID: ${data.id})`);
        } catch (err) {
            console.error('[CORTEX] Optimization failed:', err.message);
        }
    }

    getStatus() {
        return {
            lastOptimization: this.lastOptimization,
            history: this.optimizationHistory.slice(-10),
            thresholds: this.thresholds
        };
    }
}

module.exports = OptimizationCortex;
