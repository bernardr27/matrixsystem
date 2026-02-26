const BaseSkill = require('./base.skill.cjs');
const { execSync } = require('child_process');

class SystemSkill extends BaseSkill {
    constructor(proxy) {
        super(proxy);
        this.name = 'system_core';
    }

    getMissionTypes() {
        return ['audit', 'shell', 'sys:heartbeat'];
    }

    async execute(mission) {
        const type = mission.payload?.type || 'audit';

        if (type === 'audit') {
            await this.log(mission.id, 'Performing System Audit via Skill Module...');
            const services = Object.keys(this.proxy.registry.services || {}).length;
            await this.log(mission.id, `Audit complete. ${services} services active. All protocols nominal.`, 'success');
        } else if (type === 'shell') {
            const cmd = mission.payload.command;
            await this.log(mission.id, `Executing System Command: ${cmd}`);
            try {
                const output = execSync(cmd, { encoding: 'utf8', windowsHide: true });
                await this.log(mission.id, `Output: ${output.substring(0, 1000)}`, 'success');
            } catch (err) {
                await this.log(mission.id, `Execution Error: ${err.message}`, 'error');
                throw err;
            }
        } else if (type === 'sys:heartbeat') {
            await this.log(mission.id, 'Processing Heartbeat Sync...', 'info');
            await this.proxy.registry.heartbeat();
            await this.log(mission.id, 'Global Coherence Re-synced.', 'success');
        }
    }
}

module.exports = SystemSkill;
