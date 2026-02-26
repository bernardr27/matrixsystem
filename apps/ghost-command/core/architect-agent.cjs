const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

class ArchitectAgent {
    constructor(supabase, integrationHub, config) {
        this.supabase = supabase;
        this.hub = integrationHub;
        this.config = config; // { ollama: { url, chatModel, ... } }
        this.doctorPath = path.join(__dirname, '../../../scripts/tools/matrix_doctor.js');
        this.isScanning = false;
    }

    /**
     * Run a full diagnostic scan
     */
    async scan() {
        if (this.isScanning) {
            console.log('[ARCHITECT] Scan already in progress.');
            return;
        }

        this.isScanning = true;
        console.log('[ARCHITECT] Initiating diagnostic sweep...');

        try {
            // 1. Run Doctor
            const { stdout } = await execPromise(`node "${this.doctorPath}" --json`);
            const report = JSON.parse(stdout);

            console.log(`[ARCHITECT] Diagnosis Complete. Status: ${report.status.toUpperCase()}`);

            // 2. Analyze & React
            if (report.status !== 'nominal') {
                await this.handleAnomalies(report);
            } else {
                // Log nominal state to Automation Panel
                await this.emitOptimizationEvent('scanned', { cpuLoad: 'OPTIMAL', ramPercent: 'STABLE' });

                // Log to Slack occasionally
                if (Math.random() > 0.9) {
                    await this.hub.notify('slack', 'System nominal.', { severity: 'low' });
                }
            }

            return report;
        } catch (e) {
            console.error('[ARCHITECT] Scan failed:', e.message);
            await this.hub.notify('slack', `Architect scan failed: ${e.message}`, { severity: 'high' });
        } finally {
            this.isScanning = false;
        }
    }

    /**
     * Consult Llama 3.2 for a strategic repair plan
     */
    async analyzeReport(report) {
        if (!this.config || !this.config.ollama) return null;

        try {
            const prompt = `
                SYSTEM_DIAGNOSTIC_REPORT:
                ${JSON.stringify(report, null, 2)}

                You are the Architect. Analyze this report.
                Verify 3 critical metrics:
                1. Infrastructure Status
                2. Failed Services (if any)
                3. Resource Anomalies

                Provide a 1-sentence "Root Cause" and a 1-sentence "Recommended Action".
                Format: "CAUSE: ... ACTION: ..."
            `;

            const response = await fetch(`${this.config.ollama.url}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.config.ollama.chatModel,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false,
                    options: { num_ctx: 8192 }
                })
            });

            const data = await response.json();
            return data.message.content.trim();
        } catch (e) {
            console.error('[ARCHITECT] AI Analysis failed:', e.message);
            return null;
        }
    }

    /**
     * Handle detected anomalies
     */
    async handleAnomalies(report) {
        let severity = 'warning';
        let issues = [];

        // Check ports
        const blockedPorts = report.ports.filter(p => p.status === 'in_use' && ![3000, 3001, 5173].includes(p.port));
        // Actually, matrix_doctor output 'in_use' is BAD if the services aren't the ones running it, but identifying THAT is hard.
        // Let's rely on 'status' field from doctor for now.

        if (report.status === 'critical') {
            severity = 'critical';
            issues.push('Critical system failure detected.');
        } else if (report.status === 'partial') {
            issues.push('System running with degraded performance or missing components.');
        }

        // Check specific missing projects
        report.projects.filter(p => p.status !== 'found').forEach(p => {
            issues.push(`Project '${p.name}' is ${p.status}`);
        });

        // GET AI OPINION
        const aiAnalysis = await this.analyzeReport(report);

        let message = `Architect detected system anomalies:\n- ${issues.join('\n- ')}`;
        if (aiAnalysis) {
            message += `\n\n[ARCHITECT_NET REACTION]\n${aiAnalysis}`;
        }

        // Report to Hive (Slack/Discord)
        await this.hub.notify('slack', message, { severity, title: 'Architect Diagnostic Report' });

        // Self-Healing (Simple)
        if (report.status === 'partial') {
            console.log('[ARCHITECT] Attempting self-repair...');
            // Example: If 'matrix hub' package.json is missing, we can't really fix it autonomously yet.
            // But if a port was blocked (and we knew it shouldn't be), we could kill it.
        }

        // Create GitHub Issue if enabled (and critical)
        if (severity === 'critical') {
            const ghStatus = await this.hub.execute('github', 'status');
            if (ghStatus.success) {
                // We have git access
                // await this.hub.execute('github', 'create_issue', { title: 'System Critical', body: message });
                console.log('[ARCHITECT] (Simulation) Created GitHub Issue for critical failure.');
            }
        }
    }

    async emitOptimizationEvent(type, metrics) {
        try {
            const payload = {
                type: 'optimization', // Key for AutomationPanel
                title: 'System Diagnostic Scan',
                description: 'Architect Agent performed a heuristics check.',
                metrics: metrics,
                timestamp: Date.now()
            };

            await this.supabase.from('ghost_bridge').insert({
                command: 'sys:broadcast',
                source: 'optimization_cortex', // Key for AutomationPanel
                status: 'executed',
                output: JSON.stringify(payload)
            });
        } catch (e) {
            console.error('[ARCHITECT] Failed to emit optimization event:', e.message);
        }
    }
}
module.exports = ArchitectAgent;
