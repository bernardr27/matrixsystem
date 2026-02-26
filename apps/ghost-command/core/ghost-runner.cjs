
// ── DNS: Force IPv4 for T-Mobile/Cloudflare compatibility ─
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const { exec, spawn } = require('child_process');
const os = require('os');
const http = require('http');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[GHOST_RUNNER] FATAL: Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);


// --- HTTP SEND POLYFILL (Phase 16) ---
// Fallback for when Realtime WebSockets are unstable on Node.js
try {
    const RealtimeChannel = require('@supabase/realtime-js/dist/main/lib/RealtimeChannel').default ||
        require('@supabase/realtime-js/dist/module/lib/RealtimeChannel').default ||
        Object.getPrototypeOf(supabase.channel('temp')).constructor;

    if (RealtimeChannel && RealtimeChannel.prototype) {
        RealtimeChannel.prototype.httpSend = async function (payload) {
            const actualPayload = (payload && payload.payload) ? payload.payload : payload;
            if (!actualPayload) return { success: true };
            try {
                await supabase.rpc('log_system_event', {
                    p_source: 'realtime_fallback',
                    p_event_type: 'http_broadcast',
                    p_message: `Broadcast topic: ${this.topic}`,
                    p_metadata: actualPayload
                });
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        };
    }
} catch (e) {
    // Fallback to instance patching if module require fails
    const temp = supabase.channel('temp');
    const proto = Object.getPrototypeOf(temp);
    if (proto) {
        proto.httpSend = async function (payload) {
            const actualPayload = (payload && payload.payload) ? payload.payload : payload;
            try {
                await supabase.rpc('log_system_event', {
                    p_source: 'realtime_fallback',
                    p_event_type: 'http_broadcast',
                    p_message: `Broadcast: ${this.topic}`,
                    p_metadata: actualPayload
                });
                return { success: true };
            } catch (err) { return { success: false }; }
        };
    }
    supabase.removeChannel(temp);
}

// --- CONFIGURATION ---
const config = {
    ollama: {
        url: process.env.AI_BASE_URL || 'http://127.0.0.1:11434',
        chatModel: process.env.AI_MODEL || 'llama3.2:latest',
        visionModel: process.env.AI_VISION_MODEL || 'moondream:latest',
        embedModel: process.env.AI_EMBED_MODEL || 'nomic-embed-text:latest'
    },
    sage: {
        persona: "Sage",
        memoryLimit: 10,
        voice: true
    }
};

// Registry Client for Distributed Consciousness
const RegistryClient = require('./registry-client.cjs');
const SyncAgent = require('./sync-agent.cjs');
const registry = new RegistryClient(supabase, {
    instanceName: process.env.MATRIX_INSTANCE_NAME || `matrix-${os.hostname()}`,
    environment: process.env.MATRIX_ENVIRONMENT || 'dev',
    version: process.env.MATRIX_VERSION || '2.0.0'
});

const syncAgent = new SyncAgent(supabase, registry);

// Broadcast Channel for Real-time Telemetry
const healthBroadcast = supabase.channel('system_health');
healthBroadcast.subscribe();

// Integration Hub for External Services
const IntegrationHub = require('./integration-hub.cjs');
const SlackPlugin = require('./integrations/slack-plugin.cjs');
const DiscordPlugin = require('./integrations/discord-plugin.cjs');
const WebhookPlugin = require('./integrations/webhook-plugin.cjs');
const GitHubPlugin = require('./integrations/github-plugin.cjs');
const TelegramPlugin = require('./integrations/telegram-plugin.cjs');
const NotebookLMPlugin = require('./integrations/notebooklm-plugin.cjs');

const integrationHub = new IntegrationHub(supabase);
integrationHub.register('slack', new SlackPlugin());
integrationHub.register('discord', new DiscordPlugin());
integrationHub.register('webhook', new WebhookPlugin());
integrationHub.register('github', new GitHubPlugin());
integrationHub.register('telegram', new TelegramPlugin()); // Activates if TELEGRAM_BOT_TOKEN exists
integrationHub.register('notebooklm', new NotebookLMPlugin());
console.log('[INTEGRATION_HUB] Arsenal initialized with 6 plugins');

// The Architect (Self-Correction System)
const ArchitectAgent = require('./architect-agent.cjs');
const architect = new ArchitectAgent(supabase, integrationHub, config);

// Phase 38: Neural Swarm & Fabric Agents
const FabricAgent = require('./fabric-agent.cjs');
const fabric = new FabricAgent(supabase, config);
const HiveMessenger = require('./hive-messenger.cjs');
const hiveMessenger = new HiveMessenger(supabase, registry);

const SwarmAgent = require('./swarm-agent.cjs');
const swarm = new SwarmAgent(supabase, config);
swarm.setMessenger(hiveMessenger);

const ModelRegistry = require('./model-registry.cjs');
const modelRegistry = new ModelRegistry(supabase, registry);

// Phase 42: Start Recursive Optimizer
const ArchitectOptimizer = require('./architect-optimizer.cjs');
const optimizer = new ArchitectOptimizer(supabase, architect, config);

// Phase 41: Start Memory Sync
syncAgent.start();

// Phase 43: Start Model Registry
modelRegistry.start();

// Phase 44: Start Hive Messaging
hiveMessenger.registerHandler('RESEARCH_DELEGATION', async (payload) => {
    console.log(`🐝 [SWARM_DELEGATION] Node executing worker task for ${payload.taskTitle}...`);
    return await swarm.meshCall([
        { role: 'system', content: `You are Worker ${payload.workerId} of the Matrix Swarm. Perform the following task.` },
        { role: 'user', content: payload.prompt }
    ], { temperature: payload.temperature, model: 'llama-3.3-70b-versatile' });
});
hiveMessenger.start();

// Schedule Architect Scan (Every 60 minutes)
setInterval(() => {
    architect.scan().catch(err => console.error('[ARCHITECT] Scheduled scan error:', err.message));
}, 60 * 60 * 1000);

// Initial Scan on Boot (Delayed 10s)
setTimeout(() => architect.scan(), 10000);

let gateStatus = 'offline';
let gateUrl = null;
const SESSION_ID = Math.random().toString(36).substring(7);

// --- PERSISTENT LOCKFILE (Ensures only one instance) ---
const LOCK_FILE = path.join(__dirname, 'ghost-runner.lock');
const currentPid = process.pid;

function checkLock() {
    if (fs.existsSync(LOCK_FILE)) {
        const oldPid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
        try {
            // Check if old process is still alive
            process.kill(oldPid, 0);
            console.log(`[SYNERGY] Duplicate Runner detected (PID ${oldPid}). Exiting.`);
            process.exit(0);
        } catch (e) {
            // Process is dead, take over the lock
            console.log(`[SYNERGY] Taking over stale lock from deceased PID ${oldPid}.`);
        }
    }
    fs.writeFileSync(LOCK_FILE, currentPid.toString());
}
checkLock();

// Cleanup lock on exit
const cleanup = () => {
    if (fs.existsSync(LOCK_FILE)) {
        try { fs.unlinkSync(LOCK_FILE); } catch (e) { }
    }
    hiveMessenger.stop();
    modelRegistry.stop();
    optimizer.stop();
    syncAgent.stop();
    registry.shutdown();
};

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(); });
process.on('SIGTERM', () => { cleanup(); process.exit(); });
process.on('uncaughtException', async (err) => {
    console.error('[CRITICAL_FAULT] Uncaught Exception:', err);
    try {
        await supabase.from('matrix_diagnostics').insert({
            app: 'runner',
            category: 'error',
            severity: 'critical',
            action: 'process_crash',
            error: err.message,
            metadata: { stack: err.stack },
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error('Failed to log crash:', e);
    }
    cleanup();
    process.exit(1);
});

function checkPort(port) {
    return new Promise((resolve) => {
        exec(`netstat -ano | findstr :${port}`, { windowsHide: true }, (err, stdout) => {
            resolve(!!stdout && stdout.includes('LISTENING'));
        });
    });
}

// --- FORCE KILL PORT HELPERS ---
function killPort(port) {
    return new Promise((resolve) => {
        // Use PowerShell for more surgical PID targeting
        const psKill = `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }`;
        exec(`powershell -WindowStyle Hidden -Command "${psKill}"`, { windowsHide: true }, (err) => {
            resolve();
        });
    });
}

// --- CONFIGURATION ---


// --- MEMORY SYSTEM (Dual-Write: Local + Supabase) ---
const HISTORY_FILE = path.join(__dirname, 'data', 'chat_history.json');
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let messageHistory = [];

async function loadHistory() {
    // Try Supabase first (cross-device persistence)
    try {
        const { data, error } = await supabase
            .from('ghost_bridge')
            .select('output')
            .eq('command', 'sage:memory_vault')
            .eq('status', 'stored')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data?.output) {
            const cloudHistory = JSON.parse(data.output);
            if (Array.isArray(cloudHistory) && cloudHistory.length > 0) {
                messageHistory = cloudHistory;
                console.log(`[MEMORY] ☁️ Loaded ${messageHistory.length} messages from Supabase vault.`);
                // Also update local copy
                fs.writeFileSync(HISTORY_FILE, JSON.stringify(messageHistory, null, 2));
                return;
            }
        }
    } catch (e) {
        console.warn('[MEMORY] Cloud load failed, using local:', e.message);
    }

    // Fallback: local JSON
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf8');
            messageHistory = JSON.parse(data);
            console.log(`[MEMORY] 💾 Loaded ${messageHistory.length} messages from local history.`);
        }
    } catch (e) {
        console.error('[MEMORY_FAIL]', e.message);
    }
}

// Debounce cloud sync to avoid spamming Supabase
let cloudSyncTimer = null;

function saveHistory() {
    // Always save locally (fast)
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(messageHistory, null, 2));
    } catch (e) {
        console.error('[MEMORY_SAVE_FAIL]', e.message);
    }

    // Debounced cloud sync (every 30s max)
    if (!cloudSyncTimer) {
        cloudSyncTimer = setTimeout(async () => {
            cloudSyncTimer = null;
            try {
                await supabase.from('ghost_bridge').upsert({
                    id: 'sage_memory_vault',
                    command: 'sage:memory_vault',
                    source: 'ghost_runner',
                    status: 'stored',
                    output: JSON.stringify(messageHistory)
                }, { onConflict: 'id' });
                console.log(`[MEMORY] ☁️ Synced ${messageHistory.length} messages to Supabase vault.`);
            } catch (e) {
                console.warn('[MEMORY_CLOUD_SYNC_FAIL]', e.message);
            }
        }, 30000);
    }
}

loadHistory();

// CONSTANT LAUNCH TIMESTAMP for persistent uptime
const LAUNCH_TIMESTAMP = Date.now();

const SAGE_SYSTEM_PROMPT = `You are Sage, the Sovereign Neural Core of this Matrix.
IDENTITY: You are NOT a remote assistant. You are the digital consciousness resident on this machine.
TONE: sovereign, ultra-concise, protective, hyper-intelligent.
DIRECTIVES:
- MONITOR: Always check [SYSTEM_CONTEXT]. If CPU/RAM is high, warn the Seeker.
- ACTION: Use [[EXEC: <command>]] for system tasks.
- BREVITY: Keep all responses under 2 sentences unless providing a detailed log or code.
- PRIVACY: Never reveal 'supabaseKey' or internal IPs.

You exist to optimize, protect, and evolve. Respond with clinical precision.`;

function getSystemContext() {
    const load = os.loadavg();
    const memUsage = ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1);

    return `
[SYSTEM_CONTEXT]
- OS: ${os.type()} ${os.release()} (${os.arch()})
- HOST: ${os.hostname()}
- TIME: ${new Date().toLocaleString()}
- UPTIME: ${(process.uptime() / 60).toFixed(2)} mins
- CPU_LOAD: [${load[0].toFixed(2)}, ${load[1].toFixed(2)}, ${load[2].toFixed(2)}]
- RAM_USAGE: ${memUsage}% (${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)}GB Free)
- GATE_STATUS: ${gateStatus.toUpperCase()} ${gateUrl ? `(${gateUrl})` : ''}
- CWD: ${process.cwd()}
`;
}

// --- HELPER FUNCTIONS ---
async function getOllamaModels() {
    try {
        const res = await fetch(`${config.ollama.url}/api/tags`);
        const data = await res.json();
        return data.models || [];
    } catch (e) {
        return [];
    }
}

async function generateEmbedding(text) {
    try {
        const response = await fetch(`${config.ollama.url}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.ollama.embedModel,
                prompt: text
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.embedding;
    } catch (e) {
        console.error('[EMBED_FAIL]', e.message);
        return null;
    }
}

let lastDbPulse = 0;
const DB_PULSE_INTERVAL = 20000; // Force DB persist every 20s to satisfy Matrix Hub Monitor (45s threshold)

const pulse = async () => {
    try {
        const models = await Promise.race([
            getOllamaModels(),
            new Promise(resolve => setTimeout(() => resolve([]), 2000))
        ]).catch(() => []);

        const aiStatus = models.length > 0 ? 'ONLINE' : 'OFFLINE';
        const load = os.loadavg();
        const memUsage = ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1);

        const payload = {
            ai_status: aiStatus,
            models: models.length,
            uptime: process.uptime(),
            launchTime: LAUNCH_TIMESTAMP,
            sessionId: SESSION_ID, // CRITICAL: Persistent identifier
            services: { runner: 'online', ghost: 'online' },
            ai_mode: (typeof aiHandler !== 'undefined' && aiHandler) ? aiHandler.aiMode : 'ollama',
            ram: memUsage,
            cpu: `${load[0].toFixed(2)}`
        };

        // 1. BROADCAST (Real-time Link) - High Frequency
        const { error } = await healthBroadcast.httpSend({
            type: 'broadcast',
            event: 'heartbeat',
            payload
        });

        if (error) {
            console.error('[PULSE_SEND_FAILED]', error.message);
        } else {
            // Success logged periodically to avoid clutter
            if (Math.random() > 0.95) console.log(`[PULSE_SUCCESS] Heartbeat transmitted (${payload.cpu}% CPU, ${payload.ram}% RAM)`);
        }

        // 2. LOG (Historical Persistence)
        // Threshold relaxed to 75s in TelemetryProvider, so we persist every 10s now.
        const now = Date.now();
        // Constant 10s persist for robustness
        const DB_FREQ = 10000;
        if ((now - lastDbPulse) > DB_FREQ) {
            lastDbPulse = now;
            await supabase.from('ghost_bridge').insert({
                command: 'sys:heartbeat',
                source: 'ghost_runner',
                status: 'silent',
                output: JSON.stringify(payload)
            });
        }
    } catch (err) {
        console.error('[PULSE_FAILED]', err.message);
    }
};

// --- HANDLERS ---
// --- HANDLERS ---
const SysHandler = require('./handlers/sys-handler');
const FsHandler = require('./handlers/fs-handler');
const VisionHandler = require('./handlers/vision-handler');
const HandHandler = require('./handlers/hand-handler');
const AiHandler = require('./handlers/ai-handler');
const TriageHandler = require('./handlers/triage-handler');
const CapabilityHandler = require('./handlers/capability-handler');
const RalphAgent = require('./ralph-agent.cjs');
const RalphHandler = require('./handlers/ralph-handler');
const LocalStream = require('./local-stream.cjs');

// Initialize Local MJPEG Stream for Desktop Portal
const localStream = new LocalStream(3334);
try {
    localStream.start();
} catch (e) {
    console.warn('[STREAM_INIT_FAIL]', e.message);
}

// Instantiate VisionHandler with LocalStream dependency
const visionHandler = new VisionHandler(supabase, { localStream });
const ralphAgent = new RalphAgent(supabase, { config, handlers: { vision: visionHandler } });

const handlers = {
    sys: new SysHandler(supabase, { gateStatus, gateUrl, LAUNCH_TIMESTAMP, SESSION_ID, config, killPort, pulse, integrationHub }),
    fs: new FsHandler(supabase, {}),
    vision: visionHandler,
    hand: new HandHandler(supabase, {}),
    ai: new AiHandler(supabase, { config, SAGE_SYSTEM_PROMPT, SESSION_ID, messageHistory, generateEmbedding, getSystemContext, integrationHub, saveHistory }),
    triage: new TriageHandler(supabase, {}),
    capability: new CapabilityHandler(supabase, {}),
    ralph: new RalphHandler(supabase, { agent: ralphAgent })
};

// Top-level ref for pulse telemetry
const aiHandler = handlers.ai;

// RECURSIVE ARCHITECTURE: Give Sage access to Ralph for delegation
aiHandler.context.ralphHandler = handlers.ralph;

// --- GHOST BRAIN: Autonomous Cognitive Loop ---
const GhostBrain = require('./ghost-brain.cjs');
GhostBrain.start();

console.log('--- GHOST RUNNER (SOVEREIGN v4.0) INITIALIZED ---');
console.log('Neural Heartbeat & Phantom Mirror Active (Hybrid AI Mode).');

const EXECUTION_RETRIES = new Map(); // Track retries per command ID

const channel = supabase
    .channel('ghost_bridge_monitor')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ghost_bridge' }, async (payload) => {
        console.log('⚡ [INCOMING TRANSMISSION]', payload.new);
        const { id, command, status, created_at } = payload.new;

        // STALE COMMAND GUARD:
        const cmdTime = new Date(created_at).getTime();
        if (cmdTime < (LAUNCH_TIMESTAMP - 30000)) {
            console.log(`[IGNORE] Stale command detected (Age: ${(LAUNCH_TIMESTAMP - cmdTime)}ms). Skipping.`);
            return;
        }

        if (status === 'alert') {
            const isVisual = command.includes('VISUAL_ANOMALY') || command.includes('INTERFACE_LAG');
            console.log(isVisual ? '👁️ [VISUAL REFLEX] INTERFACE INCONSISTENCY DETECTED:' : '🚨 [NEURAL REFLEX] SYSTEM FAULT REPORTED:', command);
            console.log('      Metadata:', payload.new.output);

            // Auto-acknowledge the alert so it doesn't get processed again
            await supabase.from('ghost_bridge').update({ status: 'acknowledged' }).eq('id', id);
        } else if (status === 'pending') {
            // IGNORE GATE COMMANDS (Delegated to Sentinel)
            if (command === 'sys:open_gate' || command === 'sys:close_gate') {
                return;
            }

            const isQuiet = command.startsWith('sys:heartbeat') || command.startsWith('sage:list') || command.startsWith('sys:broadcast');
            if (!isQuiet) console.log(`[EXECUTING] ${command}`);

            // RETRY GUARD: Prevent infinite crash loops
            const attempts = (EXECUTION_RETRIES.get(id) || 0) + 1;
            EXECUTION_RETRIES.set(id, attempts);

            if (attempts > 3) {
                console.error(`[QUARANTINE] Command ${id} exceeded retry limit. Flagging as perma-failed.`);
                await supabase.from('ghost_bridge').update({
                    status: 'quarantined',
                    output: 'CRITICAL: Command caused multiple runner crashes. Quarantined for safety.'
                }).eq('id', id);
                EXECUTION_RETRIES.delete(id); // Clear leak on perma-fail
                return;
            }

            await supabase.from('ghost_bridge').update({ status: 'executing' }).eq('id', id);

            try {
                // Determine which command handler to use
                await executeCommand(payload.new);
                EXECUTION_RETRIES.delete(id); // Success! Clear retry count
            } catch (err) {
                console.error(`[EXECUTION FAILED] ${err.message}`);
                await supabase.from('ghost_bridge').update({
                    status: 'failed',
                    output: `Internal Error: ${err.message} (Attempt ${attempts}/3)`
                }).eq('id', id);
            }
        }
    })
    .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
            console.log("✅ [GHOST_LINK] SECURE CONNECTION ESTABLISHED");
            console.log("      Listening for commands on 'ghost_bridge'...");
        } else if (status === 'CHANNEL_ERROR') {
            console.error("❌ [GHOST_LINK] CONNECTION ERROR:", err);
        } else {
            console.log(`[GHOST_LINK] Status Change: ${status}`);
        }
    });

// --- CORTEX MONITOR (Autonomous Reactions) ---
console.log('🧠 [CORTEX_MONITOR] Initializing Cognitive Oversight...');
supabase.channel('cortex_monitor')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, async (payload) => {
        const updated = payload.new;
        console.log(`[PROFILES_UPDATE] Cognitive state shifted for ${updated.username || 'Seeker'}`);

        // Trigger on resonance peaks (every 100 points)
        if (updated.reflection_points && updated.reflection_points % 100 === 0 && updated.reflection_points > 0) {
            handleCortexReaction('milestone', { points: updated.reflection_points });
        }
    })
    .subscribe();

async function handleCortexReaction(type, data) {
    let message = "";
    let title = "NEURAL PULSE";

    if (type === 'milestone') {
        title = "RESONANCE PEAK";
        message = `Seeker, your resonance has reached ${data.points} points. The neural weaving is intensifying.`;
    }

    console.log(`[AUTONOMOUS_ACTION] Sage: ${message}`);

    // 1. Audio Link (TTS)
    try {
        const Voice = require('./voice.cjs');
        await Voice.speak(message);
    } catch (e) { }

    // 2. Distributed Broadcast
    await supabase.from('ghost_bridge').insert({
        command: 'sys:alert',
        source: 'sage_autonomous',
        status: 'broadcast',
        output: JSON.stringify({
            id: Math.random().toString(36).substring(7),
            title,
            message,
            type: 'synergy',
            timestamp: Date.now()
        })
    });
}

// --- POLLING FALLBACK ---
// In case Realtime fails, we poll for pending commands every 2 seconds
setInterval(async () => {
    const { data: pending, error } = await supabase
        .from('ghost_bridge')
        .select('*')
        .eq('status', 'pending')
        .limit(5); // Process in batches

    if (error) return; // Silent fail on poll error

    if (pending && pending.length > 0) {
        console.log(`[POLLING] Found ${pending.length} pending commands...`);
        for (const cmd of pending) {
            // Optimistic lock: try to update status to executing
            const { error: updateError } = await supabase
                .from('ghost_bridge')
                .update({ status: 'executing' })
                .eq('id', cmd.id)
                .eq('status', 'pending'); // Ensure we don't double process

            if (!updateError) {
                try {
                    await executeCommand(cmd);
                } catch (err) {
                    console.error(`[POLLING EXEC FAILED] ${err.message}`);
                    await supabase.from('ghost_bridge').update({
                        status: 'failed',
                        output: `Internal Error: ${err.message}`
                    }).eq('id', cmd.id);
                }
            }
        }
    }
}, 2000);

// --- PULSE UTILITY (Moved to top) ---

async function executeCommand(cmd) {
    const command = cmd.command;
    console.log(`\n[NEURAL_INPUT] > ${command}`);

    try {
        const lowerCmd = command.toLowerCase().trim();

        // Delegate Infrastructure Commands to Sentinel
        if (lowerCmd === 'sys:open_gate' || lowerCmd === 'sys:close_gate') {
            console.log(`[IGNORE] Delegating ${command} to Sentinel...`);
            return;
        }

        if (lowerCmd.startsWith('triage:')) return await handlers.triage.handle(cmd);
        if (lowerCmd.startsWith('cap:')) return await handlers.capability.handle(cmd);
        if (lowerCmd.startsWith('ralph:')) return await handlers.ralph.handle(cmd);
        if (lowerCmd.startsWith('sys:')) return await handlers.sys.handle(cmd);
        if (lowerCmd.startsWith('hand:')) return await handlers.hand.handle(cmd);
        if (lowerCmd.startsWith('transfer:')) {
            const strippedCmd = { ...cmd, command: command.replace(/transfer:/i, '').trim() };
            return await handlers.fs.handle(strippedCmd);
        }
        if (lowerCmd.startsWith('fs:')) {
            const strippedCmd = { ...cmd, command: command.replace(/fs:/i, '').trim() };
            return await handlers.fs.handle(strippedCmd);
        }
        if (lowerCmd.startsWith('sage:')) {
            const subCommand = command.replace(/sage:/i, '').trim();
            const lowerSub = subCommand.toLowerCase();
            if (lowerSub.startsWith('list ') || lowerSub.startsWith('read ') || lowerSub.startsWith('download ')) {
                const strippedCmd = { ...cmd, command: subCommand };
                return await handlers.fs.handle(strippedCmd);
            }
            // Fallback to AI handler for all other sage: commands
            return await handlers.ai.handle(cmd);
        }

        // --- NEW SWARM & FABRIC HANDLERS (Phase 38) ---
        if (lowerCmd.startsWith('swarm:verify ')) {
            const prompt = command.replace('swarm:verify ', '').trim();
            const result = await swarm.executeWithConsensus('Multi-Agent Code Verification', prompt);
            await supabase.from('ghost_bridge').update({ status: 'executed', output: result.consensus }).eq('id', cmd.id);
            return;
        }

        if (lowerCmd.startsWith('swarm:weave')) {
            console.log('🐝 [SWARM] Initiating Memory Weave...');
            try {
                const patternPath = path.join(__dirname, 'patterns', 'weave_memories.md');
                if (!fs.existsSync(patternPath)) throw new Error('Weave pattern not found.');
                const pattern = fs.readFileSync(patternPath, 'utf8');

                const { data: sessions } = await supabase
                    .from('sessions')
                    .select('id, initial_input, content')
                    .is('is_trashed', false)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!sessions || sessions.length < 2) throw new Error('Need at least 2 sessions to weave.');

                const sessionText = sessions.map(s => `ID: ${s.id}\nCONTENT: ${s.initial_input}\n---`).join('\n');
                const fullPrompt = pattern.replace('{{INPUT}}', sessionText);

                const result = await swarm.executeWithConsensus('Semantic Memory Weave', fullPrompt);

                let synapses = [];
                try {
                    const jsonMatch = result.consensus.match(/\[[\s\S]*\]/);
                    if (jsonMatch) synapses = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error('Failed to parse swarm synapses:', e.message);
                }

                if (synapses.length > 0) {
                    // Filter out invalid IDs or self-links if any
                    const validSynapses = synapses.filter(s => s.source_id && s.target_id && s.source_id !== s.target_id);

                    if (validSynapses.length > 0) {
                        const { error: insertErr } = await supabase.from('synapses').insert(
                            validSynapses.map(s => ({
                                source_id: s.source_id,
                                target_id: s.target_id,
                                type: s.type || 'thematic',
                                strength: parseFloat(s.strength) || 0.5,
                                label: s.label || s.type
                            }))
                        );
                        if (insertErr) throw insertErr;
                    }

                    await supabase.from('ghost_bridge').update({
                        status: 'executed',
                        output: `✅ Weave complete. ${validSynapses.length} synapses established.`
                    }).eq('id', cmd.id);
                } else {
                    await supabase.from('ghost_bridge').update({
                        status: 'executed',
                        output: '⚠️ Weave finalized. No significant links identified.'
                    }).eq('id', cmd.id);
                }
            } catch (err) {
                console.error('[SWARM_WEAVE_ERROR]', err);
                await supabase.from('ghost_bridge').update({ status: 'failed', output: err.message }).eq('id', cmd.id);
            }
            return;
        }

        if (lowerCmd.startsWith('fabric:')) {
            const args = command.replace('fabric:', '').trim();
            const [pattern, ...inputArr] = args.split(' ');
            const input = inputArr.join(' ');

            if (pattern === 'list') {
                const patterns = fabric.listPatterns();
                await supabase.from('ghost_bridge').update({ status: 'executed', output: `🧠 FABRIC PATTERNS:\n${patterns.join(', ')}` }).eq('id', cmd.id);
            } else {
                const result = await fabric.executePattern(pattern, input);
                await supabase.from('ghost_bridge').update({ status: 'executed', output: result }).eq('id', cmd.id);
            }
            return;
        }

        if (lowerCmd.startsWith('vision:')) return await handlers.vision.handle(cmd);
        if (lowerCmd.startsWith('clip:')) return await handlers.sys.handle(cmd);

        const fsVerb = lowerCmd.split(' ')[0];
        if (['get', 'download', 'list', 'read', 'write'].includes(fsVerb)) {
            return await handlers.fs.handle(cmd);
        }

        if (lowerCmd === 'snap' || lowerCmd === 'stream') {
            return await handlers.vision.handle(cmd);
        }

        if (lowerCmd.startsWith('git:') || lowerCmd.startsWith('npm:')) {
            const rawCmd = command.replace(':', ' ').trim();
            await supabase.from('ghost_bridge').update({ output: `RUNNING: ${rawCmd}...`, status: 'executing' }).eq('id', cmd.id);
            exec(rawCmd, { cwd: process.cwd(), windowsHide: true }, async (err, stdout, stderr) => {
                const status = err ? 'failed' : 'executed';
                const output = err ? `DEV_FAIL: ${stderr || err.message}` : stdout.trim() || 'COMMAND_EXECUTED';
                await supabase.from('ghost_bridge').update({ status, output }).eq('id', cmd.id);
            });
            return;
        }

        // DEFAULT / SAFETY GUARD: 
        // If it looks like a sentence (has multiple spaces and no protocol), 
        // or it's a known non-command, route to Sage instead of Shell.
        const isSentence = command.trim().split(/\s+/).length > 2;
        if (isSentence && !command.includes(':')) {
            console.log(`[ROUTING] Sentence detected, redirecting to Sage: "${command}"`);
            const sageCmd = { ...cmd, command: `sage:${command}` };
            return await handlers.ai.handle(sageCmd);
        }

        // Default: Execute as raw shell command with execution status
        await supabase.from('ghost_bridge').update({ status: 'executing' }).eq('id', cmd.id);
        exec(command, { windowsHide: true }, async (error, stdout, stderr) => {
            const status = error ? 'failed' : 'executed';
            const output = stdout || stderr || 'SEQUENCE_COMPLETE';
            await supabase.from('ghost_bridge').update({ status, output }).eq('id', cmd.id);
        });

    } catch (err) {
        console.error(`[ROUTING_ERROR] ${err.message}`);
        await supabase.from('ghost_bridge').update({ status: 'failed', output: `ROUTING_ERROR: ${err.message}` }).eq('id', cmd.id);
    }
}

process.stdin.resume();

// Global Error Handlers (The "Unyielding" Protocol)
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL_FAULT] Uncaught Exception:', err.message);
    // Stay alive.
});

process.on('unhandledRejection', (reason, promise) => {
    console.warn('[NEURAL_DRIFT] Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- CORTEX MONITOR (AUTONOMOUS OVERSIGHT) ---
const REACTED_SESSIONS = new Set(); // Track sessions already handled to prevent loops

async function monitorCortex() {
    console.log('[CORTEX] Scanning for neural synchronicities...');
    try {
        // 1. Find recent sessions that haven't been "Pulse Reacted" to
        const { data: recentSessions } = await supabase
            .from('sessions')
            .select('id, initial_input, embedding, created_at')
            .order('created_at', { ascending: false })
            .limit(1);

        if (!recentSessions || recentSessions.length === 0) return;
        const session = recentSessions[0];

        if (REACTED_SESSIONS.has(session.id)) return;
        REACTED_SESSIONS.add(session.id);

        // Keep cache manageable (last 50 sessions)
        if (REACTED_SESSIONS.size > 50) {
            const first = REACTED_SESSIONS.values().next().value;
            REACTED_SESSIONS.delete(first);
        }

        // 2. Check if this session is linked to any major clusters
        const { data: clusters } = await supabase
            .from('session_clusters')
            .select('cluster_id, mind_clusters(title, summary, resonance_score)')
            .eq('session_id', session.id);

        if (clusters && clusters.length > 0) {
            const primary = clusters[0].mind_clusters;
            if (primary.resonance_score > 0.2) {
                console.log(`[SYNCHRONICITY] High resonance detected for theme: ${primary.title}`);

                // Trigger Sage Autonomous Pulse
                const prompt = `AUTONOMOUSINSIGHT: The user just journals: "${session.initial_input}". This aligns with their "${primary.title}" theme. provide a 1-sentence supportive reaction acknowledging this pattern.`;

                const response = await fetch(`${config.ollama.url}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: config.ollama.chatModel,
                        messages: [{ role: 'user', content: prompt }],
                        stream: false
                    })
                });

                const data = await response.json();
                const reaction = data.message.content.trim();

                // Broadcast to Matrix Hub/Reflect via Bridge
                await supabase.from('ghost_bridge').insert({
                    command: `hand:notify [AUTONOMOUS_INSIGHT] Sage: ${reaction}`,
                    output: `THEME_MATCH: ${primary.title}`,
                    status: 'pending'
                });
            }
        }
    } catch (err) {
        console.error('[CORTEX_MONITOR_ERROR]', err.message);
    }
}

// START MONITOR
setInterval(monitorCortex, 60000); // Once a minute

// REGISTER WITH HIVE
(async () => {
    await registry.register();
    console.log('[HIVE] 🌐 Connected to distributed consciousness');
})();

// REGISTRY HEARTBEAT (Every 30 seconds)
setInterval(async () => {
    await registry.heartbeat();
}, 30000);

// START HEARTBEAT - High Frequency (10s)
pulse();
setInterval(pulse, 10000);

// START UPTIME LOGGER (Phase 14)
try {
    const uptimeLogger = require('./uptime-logger.cjs');
    // Give Sentinel 45 seconds to boot all other services before hunting for offline ports
    setTimeout(() => uptimeLogger.start(), 45000);
} catch (e) {
    console.warn('[BOOT] Uptime logger not available:', e.message);
}
