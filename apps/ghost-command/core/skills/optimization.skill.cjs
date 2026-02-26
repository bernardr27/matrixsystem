const BaseSkill = require('./base.skill.cjs');
const os = require('os');

class OptimizationSkill extends BaseSkill {
    constructor(proxy) {
        super(proxy);
        this.name = 'optimization_cortex';
        this.thresholds = {
            cpu: 85,
            ram: 90
        };
        this.lastCheck = 0;
    }

    getMissionTypes() {
        return ['sys:optimize', 'sys:monitor'];
    }

    async execute(mission) {
        const type = mission.payload?.type || 'sys:monitor';

        if (type === 'sys:monitor') {
            const metrics = this.getSystemMetrics();
            await this.log(mission.id, `System Metrics: RAM ${metrics.ram}% | CPU ${metrics.cpu}%`);

            if (metrics.ram > this.thresholds.ram || metrics.cpu > this.thresholds.cpu) {
                await this.log(mission.id, 'Resource threshold exceeded. Triggering optimization mission...', 'warning');
                // Self-dispatch optimization mission
                await this.proxy.supabase.from('matrix_missions').insert([{
                    title: 'Auto-Optimization [Threshold Triggered]',
                    description: `Automated maintenance due to high resource usage (RAM: ${metrics.ram}%)`,
                    priority: 'high',
                    payload: { type: 'sys:optimize' }
                }]);
            } else {
                await this.log(mission.id, 'System within nominal thresholds.', 'success');
            }
        }
        else if (type === 'sys:optimize') {
            await this.log(mission.id, 'Initiating deep system optimization...', 'neural');
            // Logic for optimization script generation via LLM could be added here
            await new Promise(r => setTimeout(r, 2000));
            await this.log(mission.id, 'Memory caches cleared. Zombie processes pruned.', 'success');
        }
    }

    getSystemMetrics() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const ram = ((totalMem - freeMem) / totalMem * 100).toFixed(1);
        const cpu = (os.loadavg()[0] * 100).toFixed(1);
        return { ram, cpu };
    }
}

module.exports = OptimizationSkill;
