/**
 * BASE SKILL TEMPLATE (v1.0.0)
 * All Matrix skills should extend this class.
 */

class BaseSkill {
    constructor(proxy) {
        this.proxy = proxy; // Reference to agent-core instance
        this.name = 'base_skill';
    }

    /**
     * Define which mission types this skill handles.
     * @returns {string[]}
     */
    getMissionTypes() {
        return [];
    }

    /**
     * Execute the mission logic.
     * @param {Object} mission 
     */
    async execute(mission) {
        throw new Error(`execute() not implemented for ${this.name}`);
    }

    /**
     * Helper for logging to mission.
     */
    async log(missionId, message, type = 'info') {
        if (this.proxy && this.proxy.logToMission) {
            await this.proxy.logToMission(missionId, message, type);
        } else {
            console.log(`[SKILL:${this.name}] [${type.toUpperCase()}] ${message}`);
        }
    }
}

module.exports = BaseSkill;
