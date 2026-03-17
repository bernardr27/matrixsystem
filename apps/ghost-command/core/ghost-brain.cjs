/**
 * Ghost Brain — Autonomous Cognitive Loop
 * 
 * Sage periodically reviews system health and takes proactive action.
 * This runs alongside ghost-runner as a lightweight monitoring daemon.
 * 
 * Powered by Groq Cloud AI for fast decision-making.
 */

const os = require('os');
const path = require('path');
const net = require('net');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const EventLogger = require('./event-logger.cjs');
const DailyDigest = require('./daily-digest.cjs');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// --- CONFIGURATION ---
const THINK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CPU_THRESHOLD = 85;  // % 
const RAM_THRESHOLD = 90;  // %
const STALE_CMD_AGE = 60 * 60 * 1000; // 1 hour
const RESTART_COOLDOWN = 10 * 60 * 1000; // 10 min cooldown between restarts

// Services to monitor for auto-recovery
const MATRIX_ROOT = path.join(__dirname, '..', '..', '..');
const MONITORED_SERVICES = {
    reflect: { port: 3000, recoverCommand: 'sys:start_reflect' },
    nexus: { port: 3001, recoverCommand: 'sys:start_nexus' }
};

let lastThought = null;
let thinkCount = 0;
let lastRestartTimes = {}; // Track cooldowns per service

// --- UTILITY: Check if a port is listening ---
function checkPort(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('error', () => { socket.destroy(); resolve(false); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.connect(port, '127.0.0.1');
    });
}

// --- CORE THINKING LOOP ---
async function think() {
    thinkCount++;
    const timestamp = new Date().toISOString();
    console.log(`\n🧠 [GHOST_BRAIN] Think Cycle #${thinkCount} @ ${timestamp}`);

    try {
        // 1. Gather System Vitals
        const cpuLoad = os.loadavg()[0];
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const ramUsage = ((totalMem - freeMem) / totalMem * 100).toFixed(1);
        const uptimeHours = (process.uptime() / 3600).toFixed(1);

        // 2. Check for stale pending commands
        const oneHourAgo = new Date(Date.now() - STALE_CMD_AGE).toISOString();
        const { data: staleCommands, error: staleError } = await supabase
            .from('ghost_bridge')
            .select('id, command, created_at')
            .eq('status', 'pending')
            .lt('created_at', oneHourAgo)
            .limit(10);

        // 3. Check Ollama health
        let ollamaOnline = false;
        try {
            const ollamaUrl = process.env.AI_BASE_URL || 'http://localhost:11434';
            const ollamaRes = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
            ollamaOnline = ollamaRes.ok;
        } catch (e) { }

        // --- DECISION ENGINE ---
        const actions = [];

        // High RAM alert
        if (parseFloat(ramUsage) > RAM_THRESHOLD) {
            actions.push({
                type: 'alert',
                severity: 'warning',
                message: `⚠️ RAM at ${ramUsage}%. Consider closing unused applications.`
            });
            EventLogger.warn('ghost_brain', 'high_ram', `RAM at ${ramUsage}%`, { ram: ramUsage });
        }

        // High CPU alert
        if (cpuLoad > CPU_THRESHOLD) {
            actions.push({
                type: 'alert',
                severity: 'warning',
                message: `⚡ CPU Load at ${cpuLoad.toFixed(1)}%. System under heavy strain.`
            });
        }

        // Stale command cleanup
        if (staleCommands && staleCommands.length > 0) {
            console.log(`[GHOST_BRAIN] Found ${staleCommands.length} stale commands. Clearing...`);
            const staleIds = staleCommands.map(c => c.id);
            await supabase.from('ghost_bridge')
                .update({ status: 'expired', output: 'Auto-expired by Ghost Brain (stale > 1hr)' })
                .in('id', staleIds);

            actions.push({
                type: 'cleanup',
                message: `🧹 Cleared ${staleCommands.length} stale commands from the bridge.`
            });
        }

        // Ollama offline warning
        if (!ollamaOnline) {
            actions.push({
                type: 'alert',
                severity: 'info',
                message: `🤖 Local Ollama is offline. Sage is running on Groq Cloud.`
            });
        }

        // --- AUTO-RECOVERY: Check critical services ---
        const serviceHealth = {};
        for (const [name, svc] of Object.entries(MONITORED_SERVICES)) {
            const alive = await checkPort(svc.port);
            serviceHealth[name] = alive ? 'online' : 'offline';

            if (!alive) {
                const lastRestart = lastRestartTimes[name] || 0;
                const cooldownExpired = Date.now() - lastRestart > RESTART_COOLDOWN;

                if (cooldownExpired) {
                    console.log(`  🔄 [AUTO-RECOVERY] ${name.toUpperCase()} is DOWN on port ${svc.port}. Restarting...`);

                    // Queue recovery for sentinel/runner instead of spawning local cmd windows.
                    await supabase.from('ghost_bridge').insert({
                        command: svc.recoverCommand,
                        source: 'ghost_brain',
                        status: 'pending',
                        output: `AUTO_RECOVERY_REQUEST: ${name}`
                    });
                    lastRestartTimes[name] = Date.now();

                    actions.push({
                        type: 'recovery',
                        severity: 'warning',
                        message: `🔄 Auto-restarted ${name.toUpperCase()} (was offline on :${svc.port})`
                    });
                } else {
                    const remainMin = ((RESTART_COOLDOWN - (Date.now() - lastRestart)) / 60000).toFixed(0);
                    console.log(`  ⏳ [AUTO-RECOVERY] ${name.toUpperCase()} still down. Cooldown: ${remainMin}m remaining.`);
                }
            }
        }

        // --- GROQ-POWERED DEEP THINK (Every 5th cycle) ---
        if (thinkCount % 5 === 0) {
            try {
                const apiKey = process.env.GROQ_API_KEY;
                if (apiKey) {
                    const sysPrompt = `You are Ghost Brain, an autonomous AI monitoring daemon. Analyze this system snapshot and provide a ONE-LINE situational assessment. Be concise, technical, and actionable. If everything is fine, say so. If there are concerns, prioritize them.`;
                    const snapshot = `CPU: ${cpuLoad.toFixed(2)} | RAM: ${ramUsage}% | Uptime: ${uptimeHours}h | Ollama: ${ollamaOnline ? 'online' : 'offline'} | Stale Commands: ${staleCommands?.length || 0} | Think Cycle: #${thinkCount}`;

                    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                        body: JSON.stringify({
                            model: 'llama-3.3-70b-versatile',
                            messages: [
                                { role: 'system', content: sysPrompt },
                                { role: 'user', content: snapshot }
                            ],
                            max_tokens: 100,
                            temperature: 0.3
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const insight = data.choices[0].message.content.trim();
                        console.log(`  🧠 [DEEP_THINK] ${insight}`);

                        // Store insight for /brain command
                        lastThought.insight = insight;
                    }
                }
            } catch (e) {
                // Non-critical, just skip
            }
        }

        // --- EXECUTE ACTIONS ---
        for (const action of actions) {
            console.log(`  [ACTION] ${action.message}`);

            // Broadcast critical alerts to Telegram via IntegrationHub
            if (action.severity === 'warning') {
                const alertPayload = {
                    id: `brain_${Date.now()}`,
                    title: 'GHOST BRAIN',
                    message: action.message,
                    type: 'warning',
                    timestamp: Date.now()
                };
                await supabase.from('ghost_bridge').insert({
                    command: 'sys:alert',
                    source: 'ghost_brain',
                    status: 'broadcast',
                    output: JSON.stringify(alertPayload)
                });
                // Mirror alerts into dedicated table for low-noise querying (best-effort).
                try {
                    await supabase.from('system_alerts').insert({
                        source: 'ghost_brain',
                        severity: 'warning',
                        title: alertPayload.title,
                        message: alertPayload.message,
                        metadata: alertPayload
                    });
                } catch { }
            }
        }

        // --- LOG THOUGHT ---
        lastThought = {
            cycle: thinkCount,
            timestamp,
            vitals: { cpu: cpuLoad.toFixed(2), ram: ramUsage, uptime: uptimeHours },
            ollama: ollamaOnline ? 'online' : 'offline',
            services: serviceHealth,
            actions: actions.length,
            staleCleared: staleCommands?.length || 0
        };

        if (actions.length > 0) {
            console.log(`  [GHOST_BRAIN] ${actions.length} action(s) taken.`);
        } else {
            console.log(`  [GHOST_BRAIN] All systems nominal. No action needed.`);
        }

    } catch (err) {
        console.error('[GHOST_BRAIN] Think Error:', err.message);
    }
}

// --- INITIALIZATION ---
function start() {
    console.log('🧠 [GHOST_BRAIN] Autonomous Cognitive Loop Activated');
    console.log(`   Think Interval: ${THINK_INTERVAL / 1000}s | CPU Threshold: ${CPU_THRESHOLD}% | RAM Threshold: ${RAM_THRESHOLD}%`);

    // Emit boot event
    EventLogger.boot('ghost_brain');

    // Phase 29: Start daily digest scheduler
    DailyDigest.start();

    // First thought after 60 seconds (allow Sentinel to ignite all apps first)
    setTimeout(think, 60000);

    // Recurring thoughts
    setInterval(think, THINK_INTERVAL);
}

module.exports = { start, think, getLastThought: () => lastThought };
