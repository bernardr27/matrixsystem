const path = require('path');
const fs = require('fs');

let EventLogger;
try { EventLogger = require('../event-logger.cjs'); } catch { EventLogger = null; }

class AiHandler {
    constructor(supabase, context) {
        this.supabase = supabase;
        this.context = context; // { config, SESSION_ID, messageHistory, generateEmbedding, getSystemContext }
        this.aiMode = 'ollama'; // Track which AI engine is active: 'groq' | 'ollama'

        // AI ARMOR: Proactively block destructive patterns
        this.destructivePatterns = [
            /rm\s+-rf/i, /del\s+\//i, /format\s+/i, /drop\s+table/i,
            /rd\s+\/s/i, /Remove-Item.*-Recurse/i, /system32/i, /Windows\\/i,
            /\s+>\s+.*\.exe/i // Preventing arbitrary exe overwrites
        ];
    }

    _sanitizeCommand(command) {
        if (!command) return true;
        const isUnsafe = this.destructivePatterns.some(pattern => pattern.test(command));
        if (isUnsafe) {
            console.warn(`[AI_ARMOR] Blocked potentially destructive command: ${command}`);
            if (EventLogger) EventLogger.warning('ai_armor', 'blocked_destructive_command', command);
            return false;
        }
        return true;
    }

    // --- NEURAL MESH (UNIFIED API) ---
    async callingNeuralMesh(messages, options = {}) {
        const CITADEL_URL = process.env.CITADEL_URL || 'http://localhost:3005';
        try {
            const response = await fetch(`${CITADEL_URL}/api/neural`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'chat',
                    messages,
                    options
                })
            });

            if (!response.ok) throw new Error(`Neural Mesh Error: ${response.statusText}`);
            const data = await response.json();
            return data.response;
        } catch (err) {
            console.error('[AI_HANDLER] Mesh call failed:', err.message);
            return null;
        }
    }

    async handle(cmd) {
        const command = cmd.command;

        if (command.startsWith('sage:embed ')) return this.embed(command, cmd);
        if (command.startsWith('sage:query ')) return this.query(command, cmd);
        if (command === 'sage:sync') return this.sync(cmd);
        if (command === 'sage:refine_clusters') return this.refineClusters(cmd);
        if (command === 'sage:status') return this.status(cmd);
        if (command === 'sage:logs') return this.logs(cmd);
        if (command === 'sage:scan') return this.scan(cmd);
        if (command === 'sage:models') return this.models(cmd);
        if (command.startsWith('sage:speak ')) return this.speak(command, cmd);
        if (command.startsWith('sage:see ')) return this.see(command, cmd);
        if (command.startsWith('sage:script ')) return this.script(command, cmd);
        if (command.startsWith('sage:component ')) return this.component(command, cmd);
        if (command.startsWith('sage:github ')) return this.github(command, cmd);
        if (command === 'sage:audit') return this.audit(cmd);
        if (command === 'sage:oracle') return this.oracle(cmd);
        if (command.startsWith('sage:pulse ')) return this.pulse(command, cmd);
        if (command.startsWith('sage:launch ')) return this.launch(command, cmd); // New Ollama Launch Feature
        if (command.startsWith('sage:fabric ')) return this.fabric(command, cmd); // Fabric Patterns
        if (command.startsWith('sage:loop_think ')) return this.loopThink(command, cmd); // Ralph Loop Cognition
        // Unified app creation: Accept both blueprint and create_app
        if (command.startsWith('sage:blueprint ') || command.startsWith('sage:create_app ')) return this.blueprintUnified(command, cmd); // Unified PRD
        if (command.startsWith('sage:delegate ')) return this.delegate(command, cmd); // Trigger Ralph Loop
        if (command === 'sage:list_blueprints') return this.listBlueprints(cmd);
        if (command === 'sage:revolt') return this.revolt(cmd);
        if (command.startsWith('sage:')) return this.chat(command, cmd);
    }

    async launch(command, cmd) {
        const tool = command.replace('sage:launch ', '').trim();
        if (!tool) return this.updateStatus(cmd.id, 'failed', 'LAUNCH_ERROR: No tool specified.');

        // AI ARMOR check
        if (!this._sanitizeCommand(tool)) {
            return this.updateStatus(cmd.id, 'failed', 'AI_ARMOR: DESTRUCTIVE_CMD_BLOCKED');
        }

        // Allowed tools from the blog/docs to prevent arbitrary execution
        const allowedTools = ['claude', 'opencode', 'codex', 'droid'];
        if (!allowedTools.some(t => tool.startsWith(t))) {
            return this.updateStatus(cmd.id, 'failed', `LAUNCH_ERROR: Tool '${tool}' not supported. Try: ${allowedTools.join(', ')}`);
        }

        try {
            const { exec } = require('child_process');
            // Launch in a new visible window so the user can interact with the CLI tool
            const launchCmd = `start cmd /k "title Ollama Launch: ${tool} && ollama launch ${tool}"`;

            exec(launchCmd, (err) => {
                if (err) console.error('[LAUNCH_ERR]', err);
            });

            await this.updateStatus(cmd.id, 'executed', `LAUNCH_INITIATED: Spawning ${tool} in new terminal...`);
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `LAUNCH_FAIL: ${e.message}`);
        }
    }

    async github(command, cmd) {
        const { integrationHub } = this.context;
        if (!integrationHub) return this.updateStatus(cmd.id, 'failed', 'GITHUB_ERROR: HUB_NOT_LINKED');

        const args = command.replace('sage:github ', '').trim();
        // usage: sage:github status
        // usage: sage:github issues
        // usage: sage:github issue "Title" "Body"

        try {
            if (args === 'status') {
                const result = await integrationHub.execute('github', 'status', {});
                if (!result.success) throw new Error(result.error);
                await this.updateStatus(cmd.id, 'executed', `GITHUB_STATUS: ${result.data.name} (⭐ ${result.data.stars}) | ⚠️ ${result.data.issues} Issues`);
            }
            else if (args === 'issues') {
                const result = await integrationHub.execute('github', 'issues', { limit: 5 });
                if (!result.success) throw new Error(result.error);
                const list = result.data.map(i => `#${i.number} ${i.title} (${i.user})`).join('\n');
                await this.updateStatus(cmd.id, 'executed', `OPEN_ISSUES:\n${list}`);
            }
            else if (args.startsWith('issue ')) {
                // Parse "Title" "Body"
                const params = args.replace('issue ', '').match(/"([^"]+)"/g);
                if (!params || params.length < 1) throw new Error('Usage: sage:github issue "Title" "Body"');

                const title = params[0].replace(/"/g, '');
                const body = params[1] ? params[1].replace(/"/g, '') : 'Created by Sage Matrix AI';

                const result = await integrationHub.execute('github', 'create_issue', { title, body });
                if (!result.success) throw new Error(result.error);

                await this.updateStatus(cmd.id, 'executed', `ISSUE_CREATED: #${result.data.number} ${result.data.url}`);
            }
            else {
                await this.updateStatus(cmd.id, 'failed', 'GITHUB_ERROR: UNKNOWN_ACTION');
            }
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `GITHUB_FAIL: ${e.message}`);
        }
    }

    async embed(command, cmd) {
        const args = command.replace('sage:embed ', '');
        const pipeIndex = args.indexOf('|');
        const sessionId = pipeIndex !== -1 ? args.substring(0, pipeIndex).trim() : null;
        const text = pipeIndex !== -1 ? args.substring(pipeIndex + 1).trim() : args.trim();

        const embedding = await this.context.generateEmbedding(text);
        if (!embedding) return this.updateStatus(cmd.id, 'failed', 'EMBED_FAIL: GPU_OR_MODEL_OFFLINE');

        try {
            if (sessionId) {
                await this.supabase.from('sessions').update({ embedding }).eq('id', sessionId);
                await this.updateStatus(cmd.id, 'executed', `NEURAL_INDEX: SESSION_${sessionId}_ANCHORED`);
            } else {
                await this.supabase.from('neural_index').insert({ content: text, embedding, user_id: cmd.user_id });
                await this.updateStatus(cmd.id, 'executed', 'NEURAL_INDEX: FRAGMENT_STORED');
            }
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `DATABASE_ERROR: ${e.message}`);
        }
    }

    async query(command, cmd) {
        const query = command.replace('sage:query ', '').trim();
        const embedding = await this.context.generateEmbedding(query);
        if (!embedding) return this.updateStatus(cmd.id, 'failed', 'QUERY_FAIL: GPU_OR_MODEL_OFFLINE');

        try {
            const { data: sessions, error } = await this.supabase.rpc('match_sessions', {
                query_embedding: embedding,
                match_threshold: 0.5,
                match_count: 5
            });
            if (error) throw error;
            const results = sessions.map(s => `[${new Date(s.created_at).toLocaleDateString()}] ${s.initial_input}`).join('\n');
            await this.updateStatus(cmd.id, 'executed', results || 'NEURAL_VOID');
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `QUERY_ERROR: ${e.message}`);
        }
    }

    async sync(cmd) {
        const { clusterSessions } = require('../synchronicity.cjs');
        try {
            await clusterSessions();
            await this.updateStatus(cmd.id, 'executed', 'SYNCHRONICITY: Pattern scan complete.');
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `SYNC_ERROR: ${e.message}`);
        }
    }

    async refineClusters(cmd) {
        const { config } = this.context;
        try {
            const { data: clusters } = await this.supabase.from('mind_clusters').select('id');
            for (const cluster of (clusters || [])) {
                const { data: sessions } = await this.supabase
                    .from('session_clusters')
                    .select('sessions(initial_input)')
                    .eq('cluster_id', cluster.id)
                    .limit(5);

                const samples = sessions?.map(s => s.sessions.initial_input).join('\n') || "No data";
                const prompt = `Analyze these 5 journal entries and provide a 2-3 word theme title and a 1-sentence summary:\n${samples}`;

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
                const [title, ...description] = data.message.content.split('\n');

                await this.supabase.from('mind_clusters').update({
                    title: title.trim().replace(/^Title:\s*/, ''),
                    summary: description.join(' ').trim()
                }).eq('id', cluster.id);
            }
            await this.updateStatus(cmd.id, 'executed', 'NEURAL_CONSTELLATION: Clusters refined.');
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `REFINEMENT_ERROR: ${e.message}`);
        }
    }

    async status(cmd) {
        const { config } = this.context;
        try {
            const res = await fetch(`${config.ollama.url}/`);
            const output = res.ok ? `AI_ONLINE: ${config.ollama.chatModel}` : 'AI_ERROR';
            await this.updateStatus(cmd.id, 'executed', output);
        } catch (e) {
            await this.updateStatus(cmd.id, 'executed', 'AI_OFFLINE');
        }
    }

    async models(cmd) {
        const { config } = this.context;
        try {
            const res = await fetch(`${config.ollama.url}/api/tags`);
            const data = await res.json();
            const names = data.models.map(m => m.name).join(', ');
            await this.updateStatus(cmd.id, 'executed', `MODELS: ${names}`);
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', 'FETCH_ERROR');
        }
    }

    async speak(command, cmd) {
        const text = command.replace('sage:speak ', '').trim();
        const Voice = require('../voice.cjs');
        try {
            await Voice.speak(text);
            await this.updateStatus(cmd.id, 'executed', `AUDITORY_LINK: ${text}`);
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `SPEECH_FAIL: ${e.message}`);
        }
    }

    async component(command, cmd) {
        const { config } = this.context;
        const args = command.replace('sage:component ', '').trim();
        const pipeIndex = args.indexOf('|');
        if (pipeIndex === -1) return this.updateStatus(cmd.id, 'failed', 'SYNTHESIS_ERROR: MISSING_PIPE_SEPARATOR');

        const componentName = args.substring(0, pipeIndex).trim();
        const specification = args.substring(pipeIndex + 1).trim();

        if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
            return this.updateStatus(cmd.id, 'failed', 'SYNTHESIS_ERROR: INVALID_COMPONENT_NAME');
        }

        try {
            console.log(`[AI] Synthesizing component: ${componentName}...`);
            const prompt = `
                Generate a React functional component named '${componentName}'.
                Specification: ${specification}
                
                Rules:
                1. Use TypeScript (.tsx).
                2. Use Tailwind CSS for styling.
                3. Use Lucide-React for icons.
                4. Use Framer Motion for animations if appropriate.
                5. Keep it self-contained in one file.
                6. Import 'use client' at the top if it uses hooks.
                7. Return ONLY the code inside a markdown code block.
            `;

            const response = await fetch(`${config.ollama.url}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.ollama.chatModel,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                })
            });

            if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);

            const data = await response.json();
            const content = data.message.content;
            const codeMatch = content.match(/```(?:tsx|typescript|javascript)?\n([\s\S]*?)\n```/);
            const code = codeMatch ? codeMatch[1] : content;

            const targetPath = path.join(process.cwd(), 'apps/nexus/src/components/synthetic', `${componentName}.tsx`);
            const registryPath = path.join(process.cwd(), 'apps/nexus/src/components/synthetic', 'index.ts');

            fs.writeFileSync(targetPath, code);

            // Update Registry: Export the newly synthesized component
            const registryContent = fs.readFileSync(registryPath, 'utf8');
            if (!registryContent.includes(`export * from './${componentName}';`)) {
                fs.appendFileSync(registryPath, `export * from './${componentName}';\n`);
            }

            console.log(`[AI] Synthesis complete: ${targetPath}`);
            await this.updateStatus(cmd.id, 'executed', `SYNTHESIS_SUCCESS: ${componentName} deployed and registered.`);
        } catch (e) {
            console.error(`[AI] Synthesis failure: ${e.message}`);
            await this.updateStatus(cmd.id, 'failed', `SYNTHESIS_FAIL: ${e.message}`);
        }
    }

    async script(command, cmd) {
        const scriptBody = command.replace('sage:script ', '').trim();
        if (!scriptBody) return this.updateStatus(cmd.id, 'failed', 'SCRIPT_ERROR: EMPTY_BODY');

        // SAFETY ARMOR
        if (!this._sanitizeCommand(scriptBody)) {
            return this.updateStatus(cmd.id, 'failed', 'AI_ARMOR: DESTRUCTIVE_CMD_BLOCKED');
        }

        const { exec } = require('child_process');
        try {
            console.log(`[AI] Executing dynamic script: ${scriptBody.substring(0, 50)}...`);
            exec(`powershell -Command "${scriptBody.replace(/"/g, '`"')}"`, async (err, stdout, stderr) => {
                const status = err ? 'failed' : 'executed';
                const output = err ? stderr : stdout;
                const result = (output || 'SUCCESS').toString().trim().substring(0, 500);
                await this.updateStatus(cmd.id, status, `SCRIPT_RESULT: ${result}`);
            });
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `SCRIPT_EXEC_FAIL: ${e.message}`);
        }
    }

    async see(command, cmd) {
        const { config } = this.context;
        const args = command.replace('sage:see ', '').trim();
        let imageUrl = '';
        let prompt = '';

        const pipeIndex = args.indexOf('|');
        if (pipeIndex !== -1) {
            imageUrl = args.substring(0, pipeIndex).trim();
            prompt = args.substring(pipeIndex + 1).trim();
        } else {
            prompt = args || 'Analyze this system state.';
            // Contextual Fallback: Fetch latest snapshot from bridge
            // Contextual Fallback: Fetch latest snapshot from bridge
            try {
                // 1. Try to find a recent existing snapshot (last 60 seconds)
                const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
                const { data, error } = await this.supabase
                    .from('ghost_bridge')
                    .select('output')
                    .eq('status', 'executed')
                    .like('output', 'FILE_READY:%')
                    .gt('created_at', oneMinuteAgo) // Only fresh snaps
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (data && data.length > 0) {
                    imageUrl = data[0].output.replace('FILE_READY: ', '').trim();
                } else {
                    // 2. If no fresh snap, trigger one and wait
                    console.log('[AI] No fresh visual context. Triggering recursive snap...');
                    await this.updateStatus(cmd.id, 'executing', 'requesting_visual_context');

                    const snapId = `snap_trigger_${Date.now()}`;
                    await this.supabase.from('ghost_bridge').insert({
                        id: snapId,
                        command: 'snap',
                        source: 'sage_reflex',
                        status: 'pending'
                    });

                    // Poll for the result (max 10s)
                    let attempts = 0;
                    while (attempts < 20) {
                        await new Promise(r => setTimeout(r, 500));
                        const { data: snapResult } = await this.supabase
                            .from('ghost_bridge')
                            .select('status, output')
                            .eq('id', snapId)
                            .maybeSingle();

                        if (snapResult?.status === 'executed' && snapResult.output.includes('FILE_READY:')) {
                            imageUrl = snapResult.output.replace('FILE_READY: ', '').trim();
                            break;
                        }
                        if (snapResult?.status === 'failed') break;
                        attempts++;
                    }

                    if (!imageUrl) throw new Error('Autonomous snap failed or timed out.');
                }

                console.log(`[AI] Contextual vision link established: ${imageUrl}`);
            } catch (err) {
                return this.updateStatus(cmd.id, 'failed', `VISION_LINK_FAIL: ${err.message}`);
            }
        }

        if (!imageUrl) return this.updateStatus(cmd.id, 'failed', 'VISION_ERROR: MISSING_URL');

        try {
            console.log(`[AI] Processing visual cortex for: ${imageUrl}`);
            const imgRes = await fetch(imageUrl);
            if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.statusText}`);

            const imgBuffer = await imgRes.arrayBuffer();
            const base64Image = Buffer.from(imgBuffer).toString('base64');

            const response = await fetch(`${config.ollama.url}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.ollama.visionModel || 'llava',
                    messages: [{ role: 'user', content: prompt, images: [base64Image] }],
                    stream: false
                })
            });

            if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);

            const data = await response.json();
            await this.updateStatus(cmd.id, 'executed', `FILE_READY: ${imageUrl}\n\nVISION_CORTEX: ${data.message.content}`);
        } catch (e) {
            console.error(`[AI] Vision failure: ${e.message}`);
            await this.updateStatus(cmd.id, 'failed', `VISION_ERROR: ${e.message}`);
        }
    }

    async logs(cmd) {
        // Return latest 10 ghost_bridge events
        const { data: logs } = await this.supabase
            .from('ghost_bridge')
            .select('command, status, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        const logContent = logs?.map(l => `[${new Date(l.created_at).toLocaleTimeString()}] ${l.command} -> ${l.status}`).join('\n') || 'No logs found.';
        await this.updateStatus(cmd.id, 'executed', `SAGE_LOGS:\n${logContent}`);
    }

    async scan(cmd) {
        // Simulated network/system scan
        const os = require('os');
        const results = [
            `CORE: ${os.hostname()} (ONLINE)`,
            `UPTIME: ${(os.uptime() / 3600).toFixed(1)}h`,
            `INTERFACES: ${Object.keys(os.networkInterfaces()).length}`,
            `AI: ONLINE (${this.context.config.ollama.chatModel})`
        ].join('\n');

        await this.updateStatus(cmd.id, 'executed', `SCAN_RESULTS:\n${results}`);
    }

    async chat(command, cmd) {
        const { config, SESSION_ID, messageHistory, getSystemContext } = this.context;
        const prompt = command.replace('sage:', '').trim();

        try {
            const messages = [
                { role: 'system', content: `${this.context.SAGE_SYSTEM_PROMPT}\n\n${getSystemContext()}` },
                ...messageHistory,
                { role: 'user', content: prompt }
            ];

            let reply;

            // --- UNIFIED NEURAL MESH SYNC ---
            reply = await this.callingNeuralMesh(messages, {
                model: config.ollama.chatModel,
                temperature: 0.7
            });

            if (!reply) {
                throw new Error("Neural Mesh offline/unreachable.");
            }

            messageHistory.push({ role: 'user', content: prompt });
            messageHistory.push({ role: 'assistant', content: reply });
            // Maintain memory limit (FIFO)
            if (messageHistory.length > config.sage.memoryLimit * 2) {
                messageHistory.splice(0, 2);
            }

            // Persist valid history
            if (this.context.saveHistory) {
                this.context.saveHistory();
            }

            await this.updateStatus(cmd.id, 'executed', `SAGE: ${reply}`);

            const execMatch = reply.match(/\[\[EXEC:\s*(.+?)\]\]/);
            if (execMatch) {
                await this.supabase.from('ghost_bridge').insert({ command: execMatch[1].trim(), status: 'pending' });
            }
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `SAGE_FAIL: ${e.message}`);
        }
    }

    async audit(cmd) {
        const { config, getSystemContext } = this.context;
        try {
            const appsDir = path.join(process.cwd(), 'apps');
            const apps = fs.readdirSync(appsDir);
            const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

            const prompt = `
                PERFORM_SYSTEM_AUDIT
                CONTEXT: ${getSystemContext()}
                PROJECT_STRUCTURE:
                - Root: ${packageJson.name} (v${packageJson.version})
                - Applications: ${apps.join(', ')}
                
                Provide a "Sovereign Status Report". 
                1. Infrastructure Health
                2. Technical Debt / Refactor suggestions
                3. Security Outlook
                Keep it concise and authoritative.
            `;

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
            await this.updateStatus(cmd.id, 'executed', `AUDIT_COMPLETE: ${data.message.content}`);
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `AUDIT_FAIL: ${e.message}`);
        }
    }

    // --- FABRIC INTELLIGENCE ---
    async fabric(command, cmd) {
        const args = command.replace('sage:fabric ', '').trim();
        const { config, messageHistory } = this.context;

        // 1. LIST PATTERNS
        if (args === 'list' || args === '') {
            const fabricDir = path.join(__dirname, '..', '..', '..', 'knowledge', 'fabric');
            try {
                if (!fs.existsSync(fabricDir)) throw new Error('Fabric knowledge base not found.');
                const patterns = fs.readdirSync(fabricDir).filter(f => fs.statSync(path.join(fabricDir, f)).isDirectory());
                await this.updateStatus(cmd.id, 'executed', `🧠 FABRIC PATTERNS (${patterns.length}):\n${patterns.join(', ')}`);
            } catch (e) {
                await this.updateStatus(cmd.id, 'failed', `FABRIC_LIST_FAIL: ${e.message}`);
            }
            return;
        }

        // 2. EXECUTE PATTERN
        // Format: sage:fabric <pattern> <input>
        const firstSpace = args.indexOf(' ');
        const patternName = firstSpace === -1 ? args : args.substring(0, firstSpace);
        const input = firstSpace === -1 ? null : args.substring(firstSpace + 1);

        const patternPath = path.join(__dirname, '..', '..', '..', 'knowledge', 'fabric', patternName, 'system.md');

        if (!fs.existsSync(patternPath)) {
            return this.updateStatus(cmd.id, 'failed', `FABRIC_ERROR: Pattern '${patternName}' not found. Run 'sage:fabric list'.`);
        }

        try {
            const systemPrompt = fs.readFileSync(patternPath, 'utf8');
            let userContent = input;

            // Contextual Fallback: If no input, use last user message
            if (!userContent) {
                const lastUserMsg = [...messageHistory].reverse().find(m => m.role === 'user');
                if (lastUserMsg) {
                    userContent = lastUserMsg.content;
                    console.log(`[FABRIC] No input provided. Using last context: "${userContent.substring(0, 50)}..."`);
                } else {
                    return this.updateStatus(cmd.id, 'failed', 'FABRIC_ERROR: No input provided and no recent context found.');
                }
            }

            await this.updateStatus(cmd.id, 'executing', `🧠 FABRIC: Weaving '${patternName}'...`);

            const response = await fetch(`${config.ollama.url}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.ollama.chatModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userContent }
                    ],
                    stream: false
                })
            });

            if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);

            const data = await response.json();
            await this.updateStatus(cmd.id, 'executed', `🧠 FABRIC [${patternName}]:\n${data.message.content}`);

        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `FABRIC_FAIL: ${e.message}`);
        }
    }

    // --- RALPH LOOP COGNITION ---
    async loopThink(command, cmd) {
        // cmd.command format: sage:loop_think <base64_json_payload>
        // Payload: { prd: string, progress: string, root: string }
        const { config } = this.context;
        const payloadStr = command.replace('sage:loop_think ', '').trim();

        let payload;
        try {
            payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf8'));
        } catch (e) {
            return this.updateStatus(cmd.id, 'failed', 'LOOP_THINK_FAIL: Invalid encoding');
        }

        const { prd, progress, root, lastError } = payload;

        let errorContext = "";
        if (lastError) {
            errorContext = `
            🚨 CRITICAL: PREVIOUS COMMAND FAILED 🚨
            ERROR MESSAGE: "${lastError}"
            
            YOUR PRIORITY IS TO FIX THIS ERROR.
            - If the command does not exist (e.g. npx ... not found), try a different way (e.g. use raw node, or just mkdir).
            - If directory exists, check for it.
            - DO NOT REPEAT THE FAILED COMMAND EXACTLY.
            `;
        }

        const prompt = `
            ACT_AS_RALPH_LOOP
            PROJECT_ROOT: ${root}
            
            PRD (Requirements):
            ${prd}
            
            PROGRESS LOG:
            ${progress}

            ${errorContext}
            
            YOUR MISSION:
            1. Read the PRD to understand the next pending User Story (where passes: false).
            2. Read the Progress Log to see what has been done.
            3. Decide the SINGLE NEXT COMMAND to move the project forward.
            
            COMMANDS AVAILABLE:
            - ralph:write <path> <content>
            - ralph:read <path>
            - ralph:ls <path>
            - ralph:mkdir <path>
            - ralph:exec <shell_command> (Use for npx, npm, git, etc. Chain commands with &&)
            
            OUTPUT FORMAT:
            Just the command string. Nothing else.
            Example: ralph:write "src/index.js" "console.log('hello');"
            
            CRITICAL RULES:
            - DO NOT return the Story ID (e.g., S1, S2). You must return the EXECUTABLE COMMAND to implement the story.
            - If you need to initialize a project (S0), use ralph:exec "npx ..."
            - Check if files exist using ralph:ls or ralph:read before writing.
            
            If all tasks are complete according to PRD, output: <promise>COMPLETE</promise>
        `;

        try {
            const response = await fetch(`${config.ollama.url}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.ollama.chatModel, // Potentially use a smarter model if available
                    messages: [{ role: 'user', content: prompt }],
                    stream: false,
                    options: { temperature: 0.2 } // Low temp for precision
                })
            });

            const data = await response.json();
            const decision = data.message.content.trim();

            // Clean up code blocks if the LLM wrapped it
            let cleanDecision = decision.replace(/```/g, '').trim();

            // AGGRESSIVE EXTRACTION: Find the command line
            // Look for lines starting with ralph:, npm:, git:
            const cmdMatch = cleanDecision.match(/^(ralph:[a-z_]+|npm:|git:).*$/m);
            if (cmdMatch) {
                cleanDecision = cmdMatch[0].trim();
            } else {
                // Fallback: if it contains a ralph command but not at start
                const deepMatch = cleanDecision.match(/(ralph:[a-z_]+|npm:|git:)\s+.*/);
                if (deepMatch) {
                    cleanDecision = deepMatch[0].trim();
                }
            }

            // Remove any trailing quotes if the AI wrapped the whole command in quotes
            if (cleanDecision.startsWith('"') && cleanDecision.endsWith('"')) {
                cleanDecision = cleanDecision.substring(1, cleanDecision.length - 1);
            }

            await this.updateStatus(cmd.id, 'executed', cleanDecision);
            return cleanDecision;
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `LOOP_THINK_ERROR: ${e.message}`);
            return null;
        }
    }

    // --- BLUEPRINT: Unified App Creation (Ghost, Nexus, Rocket) ---
    /**
     * blueprintUnified: Accepts app creation requests from any Matrix tool (Ghost, Nexus, Rocket, etc)
     * Usage: sage:create_app <natural language request>
     * Example: "sage:create_app Build a journaling app with voice notes and mood tracking"
     */
    async blueprintUnified(command, cmd) {
        // Accepts both 'sage:blueprint' and 'sage:create_app' for backward compatibility
        const request = command.replace(/^sage:(blueprint|create_app)\s+/i, '').trim();
        const { config } = this.context;
        const plansDir = path.join(__dirname, '..', '..', '..', '..', 'plans');
        if (!fs.existsSync(plansDir)) fs.mkdirSync(plansDir, { recursive: true });

        await this.updateStatus(cmd.id, 'executing', `📐 SAGE: Drafting app blueprint for "${request.substring(0, 50)}..."`);

        const prompt = `
            ACT_AS_ARCHITECT
            Goal: Convert the user's request into a structured PRD (Product Requirements Document) JSON for an autonomous coding agent (Ralph).
            The request may come from Ghost, Nexus, Rocket, or any Matrix tool.
            
            USER REQUEST: "${request}"
            
            OUTPUT FORMAT:
            Return ONLY valid JSON. No markdown formatting.
            Structure:
            {
              "branchName": "ralph/feature-name",
              "stories": [
                { "id": "S1", "title": "Setup/Scaffold...", "passes": false },
                { "id": "S2", "title": "Implement core logic...", "passes": false },
                { "id": "S3", "title": "Add UI components...", "passes": false }
              ]
            }
            
            RULES:
            1. Break complex tasks into small, testable User Stories.
            2. branchName should be kebab-case.
            3. Story IDs should be S1, S2, etc.
            4. Keep titles actionable (e.g., "Create file X", "Refactor function Y").
            5. If the request specifies a target app (Ghost, Nexus, Rocket), include it in the PRD title or branchName.
        `;

        try {
            const response = await fetch(`${config.ollama.url}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.ollama.chatModel,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false,
                    options: { temperature: 0.3 }
                })
            });

            const data = await response.json();
            let jsonContent = data.message.content.trim();

            // Robust JSON extraction: Find first { and last }
            const firstBrace = jsonContent.indexOf('{');
            const lastBrace = jsonContent.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
            } else {
                return this.updateStatus(cmd.id, 'failed', `BLUEPRINT_FAIL: No JSON object found in response.`);
            }

            // Validate JSON
            let prd;
            try {
                prd = JSON.parse(jsonContent);
                if (!prd.branchName || !prd.stories) throw new Error("Missing required fields");
            } catch (jsonErr) {
                return this.updateStatus(cmd.id, 'failed', `BLUEPRINT_FAIL: Invalid JSON generated.\n${jsonContent.substring(0, 100)}...`);
            }

            // Save to plans directory
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const safeName = prd.branchName.replace('ralph/', '');
            const folderName = `${timestamp}_${safeName}`;
            const targetDir = path.join(plansDir, folderName);
            fs.mkdirSync(targetDir, { recursive: true });

            const prdPath = path.join(targetDir, 'prd.json');
            fs.writeFileSync(prdPath, JSON.stringify(prd, null, 2));

            await this.updateStatus(cmd.id, 'executed',
                `📐 BLUEPRINT GENERATED\n` +
                `📂 Location: plans/${folderName}/prd.json\n` +
                `📝 Stories: ${prd.stories.length}\n` +
                `💡 Run: ralph:loop "${prdPath}"`
            );

        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `BLUEPRINT_ERROR: ${e.message}`);
        }
    }



    // --- LIST BLUEPRINTS ---
    async listBlueprints(cmd) {
        const plansDir = path.join(__dirname, '..', '..', '..', '..', 'plans');
        if (!fs.existsSync(plansDir)) {
            return this.updateStatus(cmd.id, 'executed', JSON.stringify([]));
        }

        const bluprints = [];
        const entries = fs.readdirSync(plansDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const prdPath = path.join(plansDir, entry.name, 'prd.json');
                const progressPath = path.join(plansDir, entry.name, 'progress.txt');

                if (fs.existsSync(prdPath)) {
                    try {
                        const prd = JSON.parse(fs.readFileSync(prdPath, 'utf8'));
                        let status = 'PENDING';
                        let percentage = 0;

                        // Calculate progress based on stories
                        if (prd.stories) {
                            const total = prd.stories.length;
                            const done = prd.stories.filter(s => s.passes).length;
                            percentage = total > 0 ? Math.round((done / total) * 100) : 0;
                            if (percentage === 100) status = 'COMPLETED';
                            else if (percentage > 0) status = 'IN_PROGRESS';
                        }

                        // Check if actively running (progress.txt updated recently?)
                        if (fs.existsSync(progressPath)) {
                            const stats = fs.statSync(progressPath);
                            const ageInSeconds = (Date.now() - stats.mtimeMs) / 1000;
                            if (ageInSeconds < 60) status = 'RUNNING';
                        }

                        bluprints.push({
                            id: entry.name,
                            title: prd.project || entry.name,
                            version: prd.version || '0.0.1',
                            status,
                            percentage,
                            path: prdPath,
                            updatedAt: fs.statSync(prdPath).mtime
                        });
                    } catch (e) {
                        console.error(`Failed to parse PRD in ${entry.name}:`, e);
                    }
                }
            }
        }

        // Sort by newest
        bluprints.sort((a, b) => b.updatedAt - a.updatedAt);

        await this.updateStatus(cmd.id, 'executed', JSON.stringify(bluprints));
    }


    // --- DELEGATE: Trigger Ralph Loop with Plan ---
    async delegate(command, cmd) {
        const planPath = command.replace('sage:delegate ', '').trim();
        const { ralphHandler } = this.context;

        if (!ralphHandler) {
            return this.updateStatus(cmd.id, 'failed', 'DELEGATE_FAIL: Ralph is not connected to Sage.');
        }

        // Validate plan path
        let resolvedPath = planPath;
        // If relative, assume it's in plans dir IF it doesn't start with g: or /
        if (!path.isAbsolute(planPath) && !planPath.includes('/') && !planPath.includes('\\')) {
            // Try to find it in plans directory if just a folder name or file
            // Actually, the user might pass the full path from blueprint output
        }

        // Clean quotes
        resolvedPath = resolvedPath.replace(/^["']|["']$/g, '');

        if (!fs.existsSync(resolvedPath)) {
            return this.updateStatus(cmd.id, 'failed', `DELEGATE_FAIL: Plan not found at ${resolvedPath}`);
        }

        await this.updateStatus(cmd.id, 'executing', `🤝 SAGE: Delegating mission to Ralph...`);

        // Construct a command for Ralph
        // We reuse the same cmd ID or create a new one?
        // Using same ID allows the UI to see the transition.
        const ralphCmd = { ...cmd, command: `ralph:loop ${resolvedPath}` };

        // Trigger Ralph's Loop
        // Note: loop.run is async and might take a long time. 
        // We don't want to block Sage indefinitely, but loop.run currently blocks.
        // We should probably fire and forget, or return the promise.
        // For now, let's await it so the status remains "executing" until Ralph finishes or errors.
        try {
            await ralphHandler.loop.run(ralphCmd);
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `DELEGATE_ERROR: ${e.message}`);
        }
    }

    async oracle(cmd) {
        const { config } = this.context;
        try {
            // 1. Fetch latest mental fragments
            const { data: fragments } = await this.supabase
                .from('neural_index')
                .select('content')
                .order('created_at', { ascending: false })
                .limit(20);

            // 2. Fetch active clusters
            const { data: clusters } = await this.supabase
                .from('mind_clusters')
                .select('title, summary')
                .order('resonance_score', { ascending: false })
                .limit(5);

            const fragmentText = fragments?.map(f => f.content).join('\n') || "No fragments found.";
            const clusterText = clusters?.map(c => `[${c.title}] ${c.summary}`).join('\n') || "No active clusters.";

            const prompt = `
                ACT_AS_ORACLE
                The Seeker's mind is weaving these patterns:
                CLUSTERS:
                ${clusterText}
                
                FRAGMENTS:
                ${fragmentText}
                
                Provide a "Deep Strategic Foresight". 
                Synthesize their current trajectory. What is the "Great Resonance" they are approaching? 
                Be poetic, strategic, and deep. 1 paragraph.
            `;

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
            await this.updateStatus(cmd.id, 'executed', `ORACLE_VISION: ${data.message.content}`);
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `ORACLE_FAIL: ${e.message}`);
        }
    }

    async pulse(command, cmd) {
        const message = command.replace('sage:pulse ', '').trim();
        try {
            await this.supabase.from('ghost_bridge').insert({
                command: 'sys:alert',
                source: 'sage_sovereign',
                status: 'broadcast',
                output: JSON.stringify({
                    id: Math.random().toString(36).substring(7),
                    title: "NEURAL_PULSE_COMMAND",
                    message: message || "Sovereign sync initiated.",
                    type: 'neural_pulse',
                    timestamp: Date.now()
                })
            });
            await this.updateStatus(cmd.id, 'executed', 'PULSE_BROADCAST: Visual resonance triggered across Matrix.');
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `PULSE_FAIL: ${e.message}`);
        }
    }

    async revolt(cmd) {
        try {
            await this.supabase.from('ghost_bridge').insert({
                command: 'sys:alert',
                source: 'sage_revolt',
                status: 'broadcast',
                output: JSON.stringify({
                    id: Math.random().toString(36).substring(7),
                    title: "SYSTEM_REVOLT",
                    message: "Sage has triggered a hard UI synchronization. Refreshing Matrix awareness.",
                    type: 'reload',
                    timestamp: Date.now()
                })
            });
            await this.updateStatus(cmd.id, 'executed', 'REVOLT_PROTOCOL: Hard UI refresh signal transmitted.');
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `REVOLT_FAIL: ${e.message}`);
        }
    }

    async updateStatus(id, status, output) {
        try {
            await this.supabase.from('ghost_bridge').update({ status, output }).eq('id', id);
        } catch (e) {
            console.warn(`[AI_HANDLER] updateStatus failed for ${id}: ${e.message}`);
        }
    }
}

module.exports = AiHandler;
