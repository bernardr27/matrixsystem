const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = 'https://phmnyenltuqxtkadnhpj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error('ERROR: VITE_SUPABASE_ANON_KEY not found in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- AI STACK INITIALIZATION ---
const AiHandler = require('./core/handlers/ai-handler.js');
const RalphAgent = require('./core/ralph-agent.cjs');
const RalphHandler = require('./core/handlers/ralph-handler.js');
const RalphWatcher = require('./core/ralph-watcher.cjs');

const config = {
    ollama: {
        url: process.env.AI_BASE_URL || 'http://localhost:11434',
        chatModel: process.env.AI_CHAT_MODEL || 'llama3.2:latest',
        visionModel: process.env.AI_VISION_MODEL || 'moondream:latest'
    },
    sage: {
        memoryLimit: 10
    }
};

const aiHandler = new AiHandler(supabase, { config, messageHistory: [], generateEmbedding: async () => null });
const ralphAgent = new RalphAgent(supabase, { config });
const ralphHandler = new RalphHandler(supabase, { agent: ralphAgent, aiHandler });
const ralphWatcher = new RalphWatcher(ralphHandler.loop);

console.log('--- GHOST BRIDGE NEURAL LINK ACTIVE ---');
console.log(`[DAEMON] AI_MODEL: ${config.ollama.chatModel}`);

// 0. START AUTONOMOUS WATCHER
ralphWatcher.start(60000); // Scan every minute

// 1. HEARTBEAT MECHANISM
const sendHeartbeat = async () => {
    const { error } = await supabase.from('ghost_bridge').insert({
        command: 'sys:heartbeat',
        source: 'ghost_bridge',
        status: 'silent',
        output: JSON.stringify({
            uptime: process.uptime(),
            pid: process.pid,
            timestamp: new Date().toISOString(),
            watcher: 'active'
        })
    });
    if (error) console.error('[HEARTBEAT ERROR]:', error.message);
};

// Initial pulse and interval
sendHeartbeat();
setInterval(sendHeartbeat, 30000);

// 2. COMMAND LISTENER
const subscription = supabase
    .channel('ghost_bridge_server')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ghost_bridge' }, async (payload) => {
        const { id, command, prompt, source } = payload.new;

        // Skip our own heartbeats and irrelevant commands
        if (command === 'sys:heartbeat' || source === 'ghost_bridge' || (command && command.startsWith('sys:'))) return;

        const task = (prompt || command || '').trim();
        console.log(`\n[TASK RECEIVED]: ${task}`);

        // Route Ralph commands through RalphHandler
        if (task.startsWith('ralph:')) {
            try {
                await ralphHandler.handle({ id, command: task });
            } catch (err) {
                console.error('[RALPH_HANDLER_ERROR]:', err.message);
                await supabase.from('ghost_bridge').update({ status: 'failed', output: err.message }).eq('id', id);
            }
            return;
        }

        // Default: Execute as shell command
        exec(task, async (error, stdout, stderr) => {
            let output = stdout || stderr || 'Command executed successfully.';
            let status = error ? 'error' : 'completed';

            console.log(`[EXECUTION COMPLETE]: ${status}`);

            await supabase
                .from('ghost_bridge')
                .update({
                    output: output.trim(),
                    status: status
                })
                .eq('id', id);
        });
    })
    .subscribe();

// Keep process alive
process.stdin.resume();
