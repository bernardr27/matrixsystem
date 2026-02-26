const BaseSkill = require('./base.skill.cjs');
const MemoryCortex = require('../memory-cortex.cjs');

class VectorSkill extends BaseSkill {
    constructor(proxy) {
        super(proxy);
        this.name = 'vector_cortex';
    }

    getMissionTypes() {
        return ['sys:recall', 'sys:remember'];
    }

    async execute(mission) {
        const type = mission.payload?.type || 'sys:recall';
        console.log(`[SKILL:VECTOR] 🎯 Executing: ${type}`);

        if (type === 'sys:recall') {
            const query = mission.payload.query || mission.title;
            await this.log(mission.id, `Searching for semantic patterns: "${query}"...`, 'neural');

            const results = await MemoryCortex.findSimilar(query, 3);
            if (results.length > 0) {
                const summary = results.map(r => `[${r.timestamp}] ${r.content.substring(0, 50)}...`).join('\n');
                await this.log(mission.id, `Recall complete. Found ${results.length} relevant context(s):\n${summary}`, 'success');
            } else {
                await this.log(mission.id, 'No similar patterns found in Memory Vault.', 'info');
            }
        }
        else if (type === 'sys:remember') {
            const content = mission.payload.content || mission.description;
            await this.log(mission.id, `Encrypting into long-term vault: "${content.substring(0, 30)}..."`);
            await MemoryCortex.logInteraction('system', content);
            await this.log(mission.id, 'Pattern locked in Chronos Vault.', 'success');
        }
    }
}

module.exports = VectorSkill;
