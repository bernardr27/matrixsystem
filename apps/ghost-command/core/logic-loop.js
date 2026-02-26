const os = require('os');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// --- CONFIG ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[CRITICAL] Missing Supabase credentials in .env');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const OptimizationCortex = require('./optimization-cortex.cjs');
const PredictiveCortex = require('./predictive-cortex.cjs');

// Integration Hub
const IntegrationHub = require('./integration-hub.cjs');
const SlackPlugin = require('./integrations/slack-plugin.cjs');
const DiscordPlugin = require('./integrations/discord-plugin.cjs');
const WebhookPlugin = require('./integrations/webhook-plugin.cjs');

const integrationHub = new IntegrationHub(supabase);
integrationHub.register('slack', new SlackPlugin());
integrationHub.register('discord', new DiscordPlugin());
integrationHub.register('webhook', new WebhookPlugin());

const ollamaUrl = process.env.AI_BASE_URL || 'http://localhost:11434';
const cortex = new OptimizationCortex(supabase, { ollama: { url: ollamaUrl } }, integrationHub);
const oracle = new PredictiveCortex(supabase, { ollama: { url: ollamaUrl } });

const LOOP_INTERVAL_MS = 5000;
let PRIME_DIRECTIVE = "Wait for instructions.";
let IS_ACTIVE = false;

console.log("--- SINGULARITY LOOP v1.0 (REFINED) INITIALIZED ---");
console.log(`[STATE] STANDBY. Waiting for 'sage:directive <goal>' to begin.`);

// Keep process alive and monitor metabolism
setInterval(() => {
    if (!IS_ACTIVE) console.log('[HEARTBEAT] Logic Core Standby...');
    monitorMetabolism();
}, 30000);

// Intelligent Optimization Monitor (Every 2 mins)
setInterval(() => {
    cortex.analyze();
}, 120000);

// Predictive Data Collection (Every 2 mins)
setInterval(async () => {
    await oracle.collect();
}, 120000);

// Predictive Analysis & Alerts (Every 10 mins)
setInterval(async () => {
    const analysis = oracle.analyze();
    if (analysis && analysis.predictions.alerts.length > 0) {
        await oracle.broadcastPrediction(analysis);
        console.log('[ORACLE] Predictions generated:', analysis.predictions.alerts.map(a => a.message).join(', '));
    }
}, 600000);

// Periodically update Immortal Memory (Every 10 mins)
setInterval(() => {
    updateImmortalMemory();
}, 600000);

async function monitorMetabolism() {
    try {
        const { data: heartbeats } = await supabase
            .from('ghost_bridge')
            .select('output, created_at')
            .eq('command', 'sys:heartbeat')
            .order('created_at', { ascending: false })
            .limit(1);

        if (heartbeats && heartbeats.length > 0) {
            const ramUsage = Math.round((1 - os.freemem() / os.totalmem()) * 100);
            const cpuLoad = os.loadavg()[0] > 2 ? 'HIGH' : 'NORM';

            console.log(`[SINGULARITY] Metabolic Scan: RAM ${ramUsage}% | CPU ${cpuLoad}`);

            // --- AUTONOMOUS MITIGATION ---
            if (ramUsage > 85) {
                console.warn(`[MITIGATION] RAM Critical (${ramUsage}%). Triggering metabolic prune...`);
                await supabase.from('ghost_bridge').insert({
                    command: 'sys:prune',
                    source: 'autonomous_metabolic_mitigation',
                    status: 'pending'
                });
                await supabase.from('ghost_bridge').insert({
                    command: 'sys:broadcast',
                    output: `⚠️ AUTONOMOUS_MITIGATION: High RAM (${ramUsage}%). Executing system prune.`,
                    status: 'executed'
                });
            }

            if (os.loadavg()[0] > 4) {
                console.warn(`[MITIGATION] CPU Critical (${os.loadavg()[0]}). Triggering neural optimization...`);
                await supabase.from('ghost_bridge').insert({
                    command: 'sys:optimize',
                    source: 'autonomous_metabolic_mitigation',
                    status: 'pending'
                });
                await supabase.from('ghost_bridge').insert({
                    command: 'sys:broadcast',
                    output: `⚡ NEURAL_OPTIMIZATION: CPU Load High. Identifying resource leaks.`,
                    status: 'executed'
                });
            }
            // ----------------------------

            // Original metabolic alert, now using local system stats
            if (ramUsage > 70 || cpuLoad === 'HIGH') {
                console.warn(`[METABOLIC_ALERT] High Load Detected (RAM: ${ramUsage}%, CPU: ${cpuLoad}). Triggering observation snap.`);
                await supabase.from('ghost_bridge').insert({
                    command: 'snap',
                    source: 'logic_loop_metabolic_watchdog',
                    status: 'pending',
                    metadata: JSON.stringify({ ram: ramUsage, cpu: cpuLoad, goal: PRIME_DIRECTIVE })
                });
            }
        }
    } catch (err) {
        // Silently fail monitoring to avoid loop crashes
    }
}

// --- LISTEN FOR DIRECTIVES ---
const channel = supabase.channel('logic_core')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ghost_bridge' }, async (payload) => {
        const { command, id } = payload.new;

        if (command && command.startsWith('sage:directive ')) {
            PRIME_DIRECTIVE = command.replace('sage:directive ', '').trim();
            IS_ACTIVE = true;
            console.log(`\n[NEW DIRECTIVE] ${PRIME_DIRECTIVE}`);
            await supabase.from('ghost_bridge').update({ status: 'executed', output: `ACCEPTED: ${PRIME_DIRECTIVE}` }).eq('id', id);
            runLoop();
        }
        else if (command === 'sys:halt') {
            IS_ACTIVE = false;
            console.log(`\n[HALT] Loop Terminated by User.`);
            await supabase.from('ghost_bridge').update({ status: 'executed', output: `LOOP_HALTED` }).eq('id', id);
        }
    })
    .subscribe();

// --- THE OODA LOOP ---
async function runLoop() {
    if (!IS_ACTIVE) return;

    console.log(`\n[CYCLE START] Goal: "${PRIME_DIRECTIVE}"`);

    try {
        // 1. OBSERVE (Capture Screen)
        console.log(">> OBSERVE (Snapshot)");
        const snapOutput = await sendAndAwait('snap');
        // snapOutput should be "FILE_READY: <url>"
        let imageUrl = snapOutput;
        if (snapOutput.includes('FILE_READY:')) {
            imageUrl = snapOutput.replace('FILE_READY: ', '').trim();
        }

        if (!imageUrl || !imageUrl.startsWith('http')) {
            throw new Error(`Failed to capture vision. Output: ${snapOutput}`);
        }
        console.log("   Vision Acquired.");

        // 2. ORIENT & DECIDE (AI Analysis)
        console.log(">> DECIDE (Thinking...)");
        const prompt = `
GOAL: ${PRIME_DIRECTIVE}
IMAGE: (Attached)

You are the Ghost Runner AI controlling a Windows PC.
Based on the image and the GOAL, decide the single next best action.

AVAILABLE ACTIONS:
- CLICK <x> <y>  (e.g., CLICK 500 300)
- TYPE <text>    (e.g., TYPE Hello World)
- HOTKEY <keys>  (e.g., HOTKEY ^{Esc} for Start Menu)
- WAIT           (If waiting for something to load)
- DONE           (If goal is achieved)

RESPONSE FORMAT:
Just the action. No markdown. No reasoning.
Example: CLICK 100 200
`;

        // Use 'sage:see' with the image URL and prompt
        const decision = await sendAndAwait(`sage:see ${imageUrl}|${prompt}`, 30000); // 30s timeout for thought
        console.log(`   Decision: "${decision}"`);

        // 3. ACT (Execute)
        if (decision && decision !== 'WAIT' && decision !== 'DONE') {
            console.log(">> ACT (Executing)");
            await executeAction(decision);
        } else if (decision === 'DONE') {
            console.log("[SUCCESS] Goal Achieved. Entering Standby.");
            IS_ACTIVE = false;
            PRIME_DIRECTIVE = "Standby";
            return;
        }

    } catch (err) {
        console.error(`[CYCLE ERROR] ${err.message}`);
    }

    if (IS_ACTIVE) {
        console.log(`[WAIT] Sleeping ${LOOP_INTERVAL_MS}ms...`);
        setTimeout(runLoop, LOOP_INTERVAL_MS);
    }
}

// --- HELPER: Send Command & Await Execution ID ---
async function sendAndAwait(cmd, timeoutMs = 15000) {
    // 1. Insert and get ID
    const { data, error } = await supabase.from('ghost_bridge').insert({
        command: cmd,
        source: 'logic_loop',
        status: 'pending'
    }).select().single();

    if (error) throw new Error(`Failed to send command: ${error.message}`);
    const cmdId = data.id;

    // 2. Poll for completion
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const { data: res, error: fetchErr } = await supabase
            .from('ghost_bridge')
            .select('status, output')
            .eq('id', cmdId)
            .single();

        if (fetchErr) {
            // Ignore transient fetch errors
        } else if (res) {
            if (res.status === 'executed') return res.output;
            if (res.status === 'failed') throw new Error(res.output);
        }

        await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error(`Timeout waiting for command: ${cmd}`);
}

async function executeAction(decision) {
    let cleanDecision = decision.replace('VISION_CORTEX:', '').trim();
    if (cleanDecision.startsWith('"') && cleanDecision.endsWith('"')) {
        cleanDecision = cleanDecision.slice(1, -1);
    }

    const parts = cleanDecision.trim().split(' ');
    const verb = parts[0].toUpperCase();

    if (verb === 'CLICK') {
        const x = parts[1];
        const y = parts[2];
        if (x && y) await sendAndAwait(`hand:click ${x} ${y}`);
    } else if (verb === 'TYPE') {
        const text = decision.substring(5); // "TYPE " is 5 chars
        await sendAndAwait(`hand:type ${text}`);
    } else if (verb === 'HOTKEY') {
        const keys = decision.substring(7); // "HOTKEY " is 7 chars
        await sendAndAwait(`hand:hotkey ${keys}`);
    } else {
        console.log(`[WARN] Unknown action: ${verb}`);
    }
}

async function updateImmortalMemory() {
    console.log("[MEMORY] Syncing system evolution to Immortal Memory...");
    try {
        const { data: recent } = await supabase
            .from('ghost_bridge')
            .select('command, output, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        const activity = recent?.map(r => `[${r.command}] -> ${r.output}`).join('\n');
        const memoryPath = path.join(__dirname, '../IMMORTAL_MEMORY.md');
        let memory = fs.readFileSync(memoryPath, 'utf8');

        const prompt = `
            Summarize the following recent system activity into a 2-3 line 'Current Status' report for the Immortal Memory artifact.
            Keep it high-level and focused on architectural or state changes.
            Activity:
            ${activity}
        `;

        const summary = await sendAndAwait(`sage:${prompt}`, 30000);
        const cleanSummary = summary.replace('SAGE: ', '').trim();

        // Update the Timestamp and Current State in the markdown
        const now = new Date().toISOString();
        memory = memory.replace(/\*\*Timestamp\*\*: .*/, `**Timestamp**: ${now}`);
        memory = memory.replace(/## 📍 CURRENT STATE & OBJECTIVES[\s\S]*?###/, `## 📍 CURRENT STATE & OBJECTIVES\n\n### CURRENT_STATUS:\n${cleanSummary}\n\n###`);

        fs.writeFileSync(memoryPath, memory);
        console.log("[MEMORY] Immortal Memory updated.");

        await supabase.from('ghost_bridge').insert({
            command: 'sys:broadcast',
            output: `📖 MEMORY_SYNC: Immortal Memory updated with latest system evolution.`,
            status: 'executed'
        });
    } catch (e) {
        console.error(`[MEMORY_ERR] ${e.message}`);
    }
}

module.exports = { monitorMetabolism }; // For testing if needed
