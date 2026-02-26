const os = require('os');
const { exec } = require('child_process');

class TriageHandler {
    constructor(supabase, context) {
        this.supabase = supabase;
        this.context = context;
    }

    async handle(cmd) {
        const action = cmd.command.replace('triage:', '').trim();
        let payload = {};
        try {
            payload = JSON.parse(cmd.payload || '{}');
        } catch (e) {
            console.error('[TRIAGE] Failed to parse payload', e);
        }

        const app = payload.app || 'all';

        // 1. triage:boot_health (Auto-run on startup, or manual trigger)
        if (action === 'boot_health' || action === 'oracle') {
            await this.runHealthScan(cmd.id, app, 'triage:boot_health');
            return;
        }

        // 2. triage:health (Matrix Hub Dashboard Poll)
        if (action === 'health') {
            await this.runHealthScan(cmd.id, app, 'triage:result');
            return;
        }

        // 3. System Optimization
        if (action === 'evolve' || action === 'optimize') {
            await this.updateStatus(cmd.id, 'executing', 'TRIAGE: INITIATING SYSTEM OPTIMIZATION...');

            // Real optimization logic
            const results = await this.optimizeSystem();

            await this.runHealthScan(cmd.id, app, 'triage:result');
            await this.updateStatus(cmd.id, 'executed', `OPTIMIZATION COMPLETE: ${JSON.stringify(results)}`);
            return;
        }

        // 4. Log Purge
        if (action === 'purge') {
            await this.updateStatus(cmd.id, 'executing', 'TRIAGE: PURGING OLD LOGS...');
            const cleaned = await this.purgeOldLogs();
            await this.runHealthScan(cmd.id, app, 'triage:result');
            await this.updateStatus(cmd.id, 'executed', `PURGE COMPLETE: ${cleaned} records removed.`);
            return;
        }

        await this.updateStatus(cmd.id, 'failed', `UNKNOWN_TRIAGE_PROTOCOL: ${action}`);
    }

    async runHealthScan(originalCmdId, targetApp, outputCommand) {
        try {
            const healthData = await this.generateHealthReport(targetApp);

            for (const report of healthData) {
                await this.supabase.from('ghost_bridge').insert({
                    command: outputCommand,
                    source: 'ghost_runner',
                    status: 'executed',
                    output: JSON.stringify({
                        app: report.app,
                        healthScore: report.healthScore,
                        issues: report.issues,
                        memory: report.memory,
                        lastError: report.lastError, // Include this for debugging
                        result: {
                            evolve: { totalFindings: report.issues },
                            purge: { lint: { errors: 0 } },
                            timestamp: new Date().toISOString()
                        }
                    })
                });
            }

            // 2. Mark the triggering command as done
            await this.updateStatus(originalCmdId, 'executed', `SCAN_COMPLETE: ${targetApp}`);
        } catch (error) {
            console.error('Health Scan Failed:', error);
            await this.updateStatus(originalCmdId, 'failed', `SCAN FAILED: ${error.message}`);
        }
    }

    async generateHealthReport(target) {
        const apps = ['reflect', 'nexus', 'ghost-command', 'runner'];
        const targets = target === 'all' ? apps : [target];
        const reports = [];

        // 1. Get System Stats
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMemPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
        const memDisplay = `${Math.round((totalMem - freeMem) / 1024 / 1024)}MB / ${Math.round(totalMem / 1024 / 1024)}MB`;

        // 2. Get DB Error Stats (Last hour)
        const hourAgo = new Date(Date.now() - 3600000).toISOString();

        for (const appName of targets) {
            // Check logs
            const { data: errors, error } = await this.supabase
                .from('matrix_diagnostics')
                .select('severity, action, error')
                .eq('app', appName)
                .gte('timestamp', hourAgo)
                .eq('severity', 'critical');

            const criticalCount = errors ? errors.length : 0;

            // Calculate Score
            // Base 100
            // -10 per critical error
            // -1 per 10% memory usage above 80% (System wide impact)

            let deduction = (criticalCount * 10);
            if (usedMemPercent > 80) deduction += Math.floor((usedMemPercent - 80) / 10);

            const score = Math.max(0, 100 - deduction);
            const lastErrorStr = errors && errors.length > 0 ? errors[0].action : null;

            reports.push({
                app: appName,
                healthScore: score,
                issues: criticalCount,
                memory: memDisplay, // Note: This is system memory, not app memory (hard to get individual app mem in node without pid)
                status: score > 50 ? 'online' : 'degraded',
                lastError: lastErrorStr
            });
        }

        return reports;
    }

    async optimizeSystem() {
        const results = { actions: [] };

        // 1. Vacuum DB (If RPC available, otherwise simulate via simple query meant to wake it up)
        // We'll just delete old pending commands to keep table light
        const { count } = await this.supabase
            .from('ghost_bridge')
            .delete({ count: 'exact' })
            .eq('status', 'executed')
            .lt('created_at', new Date(Date.now() - 86400000).toISOString()); // Older than 24h

        results.actions.push(`Cleaned ${count || 0} old ghost_bridge commands`);

        // 2. Clear Next.js Caches (Auto-fix for heavy disk usage and stale builds)
        try {
            const fs = require('fs');
            const path = require('path');
            const appsDir = 'g:\\matrix\\apps';
            let cleanedDirs = 0;
            if (fs.existsSync(appsDir)) {
                const apps = fs.readdirSync(appsDir);
                for (const app of apps) {
                    const cacheDir = path.join(appsDir, app, '.next', 'cache');
                    if (fs.existsSync(cacheDir)) {
                        fs.rmSync(cacheDir, { recursive: true, force: true });
                        cleanedDirs++;
                    }
                }
            }
            if (cleanedDirs > 0) results.actions.push(`Cleared .next/cache across ${cleanedDirs} apps to free disk space`);
        } catch (e) {
            console.error('[TRIAGE] Failed to clear Next.js caches', e);
        }

        // 3. Trigger active garbage collection if exposed
        if (global.gc) {
            global.gc();
            results.actions.push('Forced Garbage Collection');
        }

        return results;
    }

    async purgeOldLogs() {
        // Delete logs older than 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { count } = await this.supabase
            .from('matrix_diagnostics')
            .delete({ count: 'exact' })
            .lt('timestamp', sevenDaysAgo);

        return count || 0;
    }

    async updateStatus(id, status, output) {
        if (!id) return;
        await this.supabase.from('ghost_bridge').update({ status, output }).eq('id', id);
    }
}

module.exports = TriageHandler;
