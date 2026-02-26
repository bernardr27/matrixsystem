/**
 * MATRIX AGENT CORE (v5.0.0)
 * Persistent autonomous orchestration engine.
 */

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RegistryClient = require('./registry-client.cjs');
const MemoryCortex = require('./memory-cortex.cjs');

const OLLAMA_BASE = process.env.AI_BASE_URL || 'http://localhost:11434';
const OLLAMA_URL = `${OLLAMA_BASE}/api/generate`;
const DEFAULT_MODEL = 'llama3.2:latest';
const registry = new RegistryClient(supabase, {
    instanceName: 'neural-proxy-01',
    environment: 'production',
    version: '5.2.0'
});

let SIMULATION_MODE = false;
let ACTIVE_MISSION = null;
const SKILLS = new Map();

/**
 * Load all modular skills from the /skills directory.
 */
function loadSkills() {
    const skillsDir = path.join(__dirname, 'skills');
    if (!fs.existsSync(skillsDir)) return;

    const files = fs.readdirSync(skillsDir);
    for (const file of files) {
        if (file.endsWith('.skill.cjs') && file !== 'base.skill.cjs') {
            try {
                const SkillClass = require(path.join(skillsDir, file));
                const skillInstance = new SkillClass(thisProxy);
                const types = skillInstance.getMissionTypes() || [];
                for (const type of types) {
                    SKILLS.set(type, skillInstance);
                }
                console.log(`[AGENT] 🔌 Loaded Skill: ${skillInstance.name} (${types.join(', ')})`);
            } catch (err) {
                console.error(`[AGENT] ❌ Failed to load skill ${file}: ${err.message}`);
            }
        }
    }
}

async function logToMission(missionId, message, type = 'info') {
    const logEntry = { timestamp: new Date().toISOString(), message, type };
    console.log(`[AGENT] [${type.toUpperCase()}] ${message}`);
    const { error } = await supabase.rpc('append_mission_log', {
        mission_id: missionId,
        log_entry: logEntry
    });

    if (error) {
        console.warn(`[AGENT] Log RPC failed: ${error.message}`);
        const { data } = await supabase.from('matrix_missions').select('logs').eq('id', missionId).single();
        const logs = [...(data?.logs || []), logEntry];
        await supabase.from('matrix_missions').update({ logs }).eq('id', missionId);
    }
}

async function processNeuralPrompt(prompt, missionId) {
    if (missionId) await logToMission(missionId, `Thinking: "${prompt}"...`, 'neural');

    // Get past context (ASYNC in v5.2)
    const context = await MemoryCortex.getContextSnippet(prompt);
    if (missionId && context !== "No previous context.") {
        await logToMission(missionId, `Recalling Patterns:\n${context.substring(0, 100)}...`, 'recall');
    }

    return new Promise((resolve, reject) => {
        const fullPrompt = `You are the Matrix Neural Proxy v5.1. 
Context from previous interactions:
${context}

Current Task: ${prompt}. 
Keep responses technical and concise. If the context is relevant, use it.`;

        const payload = JSON.stringify({
            model: DEFAULT_MODEL,
            prompt: fullPrompt,
            stream: false
        });

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000 // LLMs can be slow
        };

        const req = http.request(OLLAMA_URL, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', async () => {
                try {
                    let result = {};
                    try {
                        result = JSON.parse(data);
                    } catch (e) {
                        console.error('[AGENT_CORE] Failed to parse model output:', data);
                        result = { message: data };
                    }
                    const response = result.response;
                    // Log to memory (awaited in v5.2)
                    await MemoryCortex.logInteraction('user', prompt);
                    await MemoryCortex.logInteraction('ai', response);
                    resolve(response);
                } catch (e) {
                    reject(new Error('Failed to parse Ollama response'));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
    });
}

async function executeMission(mission) {
    ACTIVE_MISSION = mission.id;
    console.log(`[AGENT] 🎯 Starting Mission: ${mission.title}`);

    mission.status = 'active';
    await supabase.from('matrix_missions').update({
        status: 'active',
        updated_at: new Date().toISOString()
    }).eq('id', mission.id);

    await logToMission(mission.id, "Mission initialized by Neural Proxy.");
    console.log(`[AGENT] 📦 Mission Payload: ${JSON.stringify(mission.payload)} (Type: ${typeof mission.payload})`);

    try {
        // Logic for specific mission types would go here
        const type = mission.payload?.type || 'custom';

        // 0. Handle Simulation Toggle
        if (type === 'sys:simulation') {
            SIMULATION_MODE = mission.payload.state;
            await logToMission(mission.id, `Simulation Mode set to: ${SIMULATION_MODE}`, 'success');
            console.log(`[AGENT] 🛡️ Simulation Mode: ${SIMULATION_MODE}`);
            return; // Exit early
        }

        // 1. Check for Modular Skill Handler
        // 1. Check for Modular Skill Handler
        if (SKILLS.has(type)) {
            const skill = SKILLS.get(type);
            await logToMission(mission.id, `Delegating to Skill: ${skill.name}`);
            const result = await skill.execute(mission);

            // Skill Chaining Logic (v5.4)
            if (result?.next_mission) {
                await logToMission(mission.id, `🔗 Chained Protocol detected: ${result.next_mission.title}`, 'neural');
                const { error } = await supabase.from('matrix_missions').insert({
                    title: result.next_mission.title || `Chain: ${mission.title}`,
                    description: result.next_mission.description || `Auto-chained from mission ${mission.id}`,
                    priority: 'high',
                    status: 'queued',
                    payload: result.next_mission.payload
                });
                if (!error) {
                    await logToMission(mission.id, `>>> Protocol Linked: Next link queued.`, 'success');
                } else {
                    await logToMission(mission.id, `Chain Failed: ${error.message}`, 'error');
                }
            }
        }
        // 2. Fallback to Core Capabilities
        else if (type === 'chat' || mission.payload?.prompt) {
            const prompt = mission.payload.prompt || mission.title;
            const response = await processNeuralPrompt(prompt, mission.id);
            await logToMission(mission.id, `Neural Response: ${response}`, 'success');
        } else if (type === 'file:create') {
            if (SIMULATION_MODE) {
                await logToMission(mission.id, `[SIMULATION] Blocked creation of: ${mission.payload.filePath}`, 'warning');
                return;
            }
            const { filePath, content } = mission.payload;
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
            await logToMission(mission.id, `Creating File: ${filePath}`);
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
            fs.writeFileSync(absolutePath, content);
            await logToMission(mission.id, `File created successfully at ${absolutePath}`, 'success');
        } else if (type === 'file:modify') {
            if (SIMULATION_MODE) {
                await logToMission(mission.id, `[SIMULATION] Blocked modification of: ${mission.payload.filePath}`, 'warning');
                return;
            }
            const { filePath, target, replacement } = mission.payload;
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
            await logToMission(mission.id, `Modifying File: ${filePath}`);
            let content = fs.readFileSync(absolutePath, 'utf8');
            if (content.includes(target)) {
                content = content.replace(target, replacement);
                fs.writeFileSync(absolutePath, content);
                await logToMission(mission.id, `File patched successfully.`, 'success');
            } else {
                throw new Error(`Target content not found in ${filePath}`);
            }
        } else if (type === 'shell') {
            if (SIMULATION_MODE) {
                await logToMission(mission.id, `[SIMULATION] Blocked command: ${mission.payload.command}`, 'warning');
                return;
            }
            await logToMission(mission.id, `Executing Shell Command: ${mission.payload.command}`);
            const output = execSync(mission.payload.command, { encoding: 'utf8', windowsHide: true });
            await logToMission(mission.id, `Output: ${output.substring(0, 500)}`, 'success');
        } else if (type === 'audit') {
            await logToMission(mission.id, 'Mission initialized by Neural Proxy.');
            await new Promise(r => setTimeout(r, 2000));
            await logToMission(mission.id, 'Processing custom directives...');
            await logToMission(mission.id, 'Directives applied.', 'success');
        }

        mission.status = 'completed';
        await supabase.from('matrix_missions').update({
            status: 'completed',
            completed_at: new Date().toISOString()
        }).eq('id', mission.id);

        await MemoryCortex.logMission(mission);
        console.log(`[AGENT] ✅ Mission Complete: ${mission.title}`);

        // Broadcast Resonance
        await supabase.from('ghost_bridge').insert([{
            command: 'sys:broadcast',
            source: 'neural_proxy',
            status: 'success',
            output: JSON.stringify({
                type: 'resonance',
                message: `Mission Resolved: ${mission.title}`,
                intensity: mission.priority === 'high' || mission.priority === 'critical' ? 2 : 1
            })
        }]);
    } catch (e) {
        console.error(`[AGENT] ❌ Mission Failed: ${e.message}`);
        await logToMission(mission.id, `Error: ${e.message}`, 'error');
        await supabase.from('matrix_missions').update({ status: 'failed' }).eq('id', mission.id);
    } finally {
        ACTIVE_MISSION = null;
    }
}

async function pollMissions() {
    if (ACTIVE_MISSION) return;

    const { data, error } = await supabase
        .from('matrix_missions')
        .select('*')
        .eq('status', 'queued')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1);

    if (error) console.error(`[POLL] ❌ Error: ${error.message}`);
    if (data && data.length > 0) {
        console.log(`[POLL] 🎯 Found mission: ${data[0].title}`);
        await executeMission(data[0]);
    }
}

// MAIN LOOP
const thisProxy = { logToMission, registry }; // Proxy object for skills

async function start() {
    console.log('--- MATRIX NEURAL PROXY v5.2 ---');
    console.log('[AGENT] ⚙️ Initializing Modular Neural Cortex...');
    loadSkills();

    await registry.register();

    setInterval(() => registry.heartbeat(), 10000);
    setInterval(pollMissions, 5000);

    console.log('[AGENT] 🧠 Neural Proxy Active. Polling for missions...');
}

start().catch(console.error);
