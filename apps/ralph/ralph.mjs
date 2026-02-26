/**
 * RALPH (Matrix Native Coding Agent) - CLI Interface
 * v3.0 — PRD-driven loop + freeform mode
 * 
 * Usage:
 *   node ralph.mjs --prd docs/prd/MY_FEATURE.md     # PRD loop mode
 *   node ralph.mjs "Build a login page"              # Freeform mode
 *   node ralph.mjs                                   # Interactive mode
 */

import { RalphCore } from '../../core/sage/ralph-core.mjs';
import readline from 'readline';
import path from 'path';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('\x1b[36m╔══════════════════════════════════════════════╗\x1b[0m');
console.log('\x1b[36m║  RALPH — Recursive Autonomous Loop v3.0     ║\x1b[0m');
console.log('\x1b[36m║  Powered by Sage Core Engine                ║\x1b[0m');
console.log('\x1b[36m╚══════════════════════════════════════════════╝\x1b[0m\n');

async function ask(question) {
    return new Promise(resolve => rl.question(`\x1b[33m[?] ${question} \x1b[0m`, resolve));
}

async function main() {
    const args = process.argv.slice(2);

    // PRD mode: --prd <path>
    const prdIndex = args.indexOf('--prd');
    if (prdIndex !== -1 && args[prdIndex + 1]) {
        const prdFile = args[prdIndex + 1];
        const workDir = process.cwd();
        const ralph = new RalphCore(workDir);

        console.log(`\x1b[35m[RALPH] Mode: PRD Loop\x1b[0m`);
        console.log(`\x1b[35m[RALPH] PRD: ${prdFile}\x1b[0m`);
        console.log(`\x1b[35m[RALPH] Working Dir: ${workDir}\x1b[0m\n`);

        const result = await ralph.runPRDLoop(prdFile);

        if (result.success) {
            console.log(`\n\x1b[32m════════════════════════════════════\x1b[0m`);
            console.log(`\x1b[32m  <promise>COMPLETE</promise>\x1b[0m`);
            console.log(`\x1b[32m  All tasks passed in ${result.loops} loops\x1b[0m`);
            console.log(`\x1b[32m════════════════════════════════════\x1b[0m`);
        } else {
            console.log(`\n\x1b[31m════════════════════════════════════\x1b[0m`);
            console.log(`\x1b[31m  LOOP HALTED\x1b[0m`);
            console.log(`\x1b[31m  ${result.error || `Failed task: ${result.failedTask}`}\x1b[0m`);
            console.log(`\x1b[31m════════════════════════════════════\x1b[0m`);
        }

        process.exit(result.success ? 0 : 1);
    }

    // Freeform mode (original behavior)
    const goal = args.join(' ') || await ask('What is your objective?');
    const ralph = new RalphCore(process.cwd());

    console.log(`\x1b[35m[RALPH] Mode: Freeform\x1b[0m`);
    console.log(`\x1b[35m[RALPH] Objective: "${goal}"\x1b[0m`);

    // Auto-loop for CLI
    let active = true;
    while (active) {
        console.log('\n[RALPH] Thinking...');
        const plan = await ralph.think(goal);

        if (plan.tool === 'COMPLETE') {
            console.log(`\n\x1b[32m[SUCCESS] ${plan.args[0]}\x1b[0m`);
            active = false;
            break;
        }

        console.log(`\x1b[34m[THOUGHT] ${plan.thought}\x1b[0m`);
        console.log(`[ACTION] ${plan.tool}: ${JSON.stringify(plan.args)}`);

        try {
            const { done, result } = await ralph.execute(plan.tool, plan.args, (msg) => console.log(msg));
            console.log(`[RESULT] ${result.substring(0, 100)}...`);

            if (done) {
                console.log(`\n\x1b[32m[DONE] Mission Accomplished.\x1b[0m`);
                active = false;
            }
        } catch (e) {
            console.error(`[ERROR] ${e.message}`);
            active = false;
        }
    }

    process.exit(0);
}

main();
