const { createClient } = require('@supabase/supabase-js');

// Constants
const SCAN_INTERVAL = 30000; // 30s
const CRITICAL_THRESHOLD_MINUTES = 5;

// Reflex Definitions
const REFLEX_MAP = [
    {
        // Condition: Reflect Error Storm
        name: 'REFLEX_STABILIZE_REFLECT',
        check: (errors) => {
            const recentErrors = errors.filter(e =>
                e.app === 'reflect' &&
                e.severity === 'critical' &&
                new Date(e.timestamp) > new Date(Date.now() - 60000) // Last 1 min
            );
            return recentErrors.length >= 3;
        },
        action: 'sys:restart_reflect',
        cooldown: 300000 // 5m cooldown
    },
    {
        // Condition: Sentinel Flatline
        name: 'REFLEX_REVIVE_SENTINEL',
        check: (errors, metrics) => {
            // If we haven't seen a Sentinel heartbeat in > 2 minutes
            // Note: This requires GhostBrain to track heartbeat, which we can mock for now 
            // or infer from "connection_error" logs if we had them.
            // For Phase 2, we'll stick to error log scanning.
            return false;
        },
        action: 'sys:start_sentinel',
        cooldown: 600000
    }
];

class GhostBrain {
    constructor(url, key) {
        this.supabase = createClient(url, key);
        this.lastReflexFired = {}; // { reflexName: timestamp }
        console.log('[GHOST_BRAIN] Neural Cortex Initialized.');
    }

    start() {
        console.log('[GHOST_BRAIN] Cognition Loop Started.');
        setInterval(() => this.think(), SCAN_INTERVAL);
        this.think(); // Initial thought
    }

    async think() {
        try {
            const fs = require('fs');
            // fs.appendFileSync('brain.log', `[${new Date().toISOString()}] Thinking...\n`);

            // 1. Scan Short-Term Memory (Diagnostics)
            const { data: errors, error } = await this.supabase
                .from('matrix_diagnostics')
                .select('*')
                .eq('severity', 'critical')
                .gte('timestamp', new Date(Date.now() - (CRITICAL_THRESHOLD_MINUTES * 60000)).toISOString());

            if (error) throw error;

            if (errors && errors.length > 0) {
                const fs = require('fs');
                fs.appendFileSync('brain.log', `[${new Date().toISOString()}] Found ${errors.length} critical errors.\n`);
                console.log(`[GHOST_BRAIN] Analyzing ${errors.length} critical signals...`);
                this.evaluateReflexes(errors);
            }
        } catch (err) {
            console.error('[GHOST_BRAIN] Migraine (Scan Failed):', err.message);
        }
    }

    async evaluateReflexes(errors) {
        for (const reflex of REFLEX_MAP) {
            const lastFired = this.lastReflexFired[reflex.name] || 0;
            const onCooldown = Date.now() - lastFired < reflex.cooldown;

            if (!onCooldown && reflex.check(errors)) {
                console.warn(`[GHOST_BRAIN] ⚡ TRIGGERING REFLEX: ${reflex.name}`);
                await this.triggerReflex(reflex.action, reflex.name);
                this.lastReflexFired[reflex.name] = Date.now();
            }
        }
    }

    async triggerReflex(command, reason) {
        // Fire command into the Bridge (Runner will pick it up)
        await this.supabase.from('ghost_bridge').insert({
            command: command,
            source: 'ghost_brain',
            status: 'pending',
            output: `[AUTO-REFLEX] Triggered by ${reason}`
        });
    }
}

module.exports = GhostBrain;
