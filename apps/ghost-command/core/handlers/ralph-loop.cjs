const fs = require('fs');
const path = require('path');

class RalphLoop {
    constructor(handler, aiHandler, context) {
        this.handler = handler;
        this.aiHandler = aiHandler;
        this.context = context; // { config, ... }
        this.maxIterations = 5;
    }

    async run(cmd) {
        const prdPath = cmd.command.replace(/^ralph:loop\s+/i, '').trim();

        if (!fs.existsSync(prdPath)) {
            await this.aiHandler.updateStatus(cmd.id, 'failed', `LOOP_ERROR: PRD not found at ${prdPath}`);
            return;
        }

        const projectRoot = path.dirname(prdPath);
        const progressPath = path.join(projectRoot, 'progress.txt');

        // Initialize progress if missing
        if (!fs.existsSync(progressPath)) {
            fs.writeFileSync(progressPath, '# Ralph Progress Log\nStarted: ' + new Date().toISOString() + '\n---\n');
        }

        let iteration = 1;
        while (iteration <= this.maxIterations) {
            await this.aiHandler.updateStatus(cmd.id, 'executing', `🔄 RALPH_LOOP: Iteration ${iteration}/${this.maxIterations}`);
            console.log(`[RALPH_LOOP] Starting Iteration ${iteration}...`);

            // 1. Read State
            const prdContent = fs.readFileSync(prdPath, 'utf8');
            const progressContent = fs.readFileSync(progressPath, 'utf8');

            // check stop condition
            if (progressContent.includes('<promise>COMPLETE</promise>')) {
                await this.aiHandler.updateStatus(cmd.id, 'executing', '✅ RALPH_LOOP: Tasks finished. Generating Internal PR...');
                await this.generateInternalPR(prdPath, progressContent, projectRoot);
                await this.aiHandler.updateStatus(cmd.id, 'executed', '✅ RALPH_LOOP: Implementation complete. Internal PR opened in docs/prd/internal_prs/');
                return;
            }

            // 2. AI Think
            const nextAction = await this.decideNextStep(prdContent, progressContent, projectRoot);

            if (!nextAction) {
                await this.aiHandler.updateStatus(cmd.id, 'failed', 'LOOP_ERROR: AI failed to decide next step.');
                return;
            }

            // 3. Execute (REAL EXECUTION NOW)
            let decisionLog = `\n## Iteration ${iteration}\nProposed Action: ${nextAction}\n`;

            // Execute via RalphHandler
            const subCmd = {
                id: `${cmd.id}_iter_${iteration}`,
                command: nextAction,
                user_id: 'RALPH_LOOP'
            };

            let output = '';
            let error = null;

            try {
                await this.handler.handle(subCmd);
                output = "Command executed successfully.";
            } catch (e) {
                error = e.message;
                output = `Error: ${e.message}`;
            }

            decisionLog += `Result: ${output}\n---\n`;
            fs.appendFileSync(progressPath, decisionLog);

            await this.aiHandler.updateStatus(cmd.id, 'executing', `Executed: ${nextAction.substring(0, 50)}...`);

            iteration++;
            this.lastError = error;
            await new Promise(r => setTimeout(r, 2000));
        }

        await this.aiHandler.updateStatus(cmd.id, 'executed', `RALPH_LOOP: Max iterations (${this.maxIterations}) reached.`);
    }

    async scan() {
        const prdDir = path.join(__dirname, '..', '..', '..', '..', 'docs', 'prd');
        if (!fs.existsSync(prdDir)) return;

        const files = fs.readdirSync(prdDir).filter(f => f.endsWith('.md'));

        for (const file of files) {
            const prdPath = path.join(prdDir, file);
            const progressPath = path.join(prdDir, 'progress', `${path.basename(file, '.md')}_progress.txt`);

            // Check if progress already indicates completion
            if (fs.existsSync(progressPath)) {
                const progress = fs.readFileSync(progressPath, 'utf8');
                if (progress.includes('<promise>COMPLETE</promise>')) continue;
            }

            console.log(`[RALPH_SCAN] Detected new/active PRD: ${file}`);
            // Logic to trigger run() would go here, or handled by the watcher
        }
    }

    async generateInternalPR(prdPath, progress, root) {
        const prdName = path.basename(prdPath, '.md');
        const prDir = path.join(__dirname, '..', '..', '..', '..', 'docs', 'prd', 'internal_prs', 'pending');
        if (!fs.existsSync(prDir)) fs.mkdirSync(prDir, { recursive: true });

        const prPath = path.join(prDir, `INTERNAL_PR_${prdName}.md`);

        const prContent = `# Internal PR: ${prdName} ⌬\n\n` +
            `> **Status:** 🟡 PENDING REVIEW\n` +
            `> **Source PRD:** [${prdName}](file:///${prdPath})\n` +
            `> **Generated:** ${new Date().toISOString()}\n\n` +
            `## Summary of Changes\n\n` +
            `${progress.split('---')[1] || 'See progress logs for details.'}\n\n` +
            `## Instructions for Reviewer\n` +
            `1. Verify the code implementation matches the PRD requirements.\n` +
            `2. Run \`npm run build\` to ensure no regressions.\n` +
            `3. To approve, change **Status** to \`APPROVED\` and move file to \`approved/\` folder.\n`;

        fs.writeFileSync(prPath, prContent);
        console.log(`[RALPH_LOOP] Internal PR generated: ${prPath}`);
    }

    async decideNextStep(prd, progress, root) {
        // Include lastError in the payload
        const payload = JSON.stringify({ prd, progress, root, lastError: this.lastError });

        // Reset lastError after using it (so we don't fix old errors forever)
        this.lastError = null;

        const base64Payload = Buffer.from(payload).toString('base64');
        const command = `sage:loop_think ${base64Payload}`;

        // Create a sub-command ID for the thought process to track it in logs
        const thoughtCmd = {
            id: `loop_thought_${Date.now()}`,
            command: command,
            user_id: 'RALPH_LOOP_AUTO'
        };

        // Call AiHandler directly
        // Note: loopThink returns the decision string now
        const decision = await this.aiHandler.loopThink(command, thoughtCmd);

        if (!decision) return null;

        // AiHandler already cleans, but extra safety:
        return decision.replace(/```/g, '').trim();
    }
}

module.exports = RalphLoop;
