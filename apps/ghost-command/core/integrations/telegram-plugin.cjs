const { Telegraf } = require('telegraf');

class TelegramPlugin {
    constructor() {
        this.bot = null;
        this.bridge = null;
        this.authorizedUser = process.env.TELEGRAM_USER_ID; // Optional: Lock to one user
    }

    async initialize(bridge, context) {
        this.bridge = bridge;
        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (!token) {
            console.error('❌ [TELEGRAM] Missing TELEGRAM_BOT_TOKEN in .env');
            return;
        }

        this.bot = new Telegraf(token);

        // --- COMMAND HANDLERS ---
        this.bot.command('start', (ctx) => {
            ctx.reply(
                '👁️ *NEO-MATRIX LINK ESTABLISHED*\n\n' +
                '🧠 Sage AI: Online\n' +
                '👻 Ghost Runner: Active\n\n' +
                'Type naturally to chat with Sage, or use /help for commands.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        keyboard: [
                            [{ text: '📊 /status' }, { text: '🧠 /brain' }],
                            [{ text: '🔒 /lock' }, { text: '🔍 /scan' }],
                            [{ text: '⚡ /optimize' }, { text: '❓ /help' }]
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: false
                    }
                }
            );
        });

        this.bot.command('help', (ctx) => {
            ctx.reply(
                '📖 *MATRIX COMMAND REFERENCE*\n\n' +
                '*System:*\n' +
                '  /status — System vitals\n' +
                '  /lock — Lock workstation\n' +
                '  /optimize — Find heavy processes\n' +
                '  /prune — Clear temp files\n' +
                '  /reboot — Reboot PC (30s timer)\n' +
                '  /shutdown — Shutdown PC (30s timer)\n' +
                '  /abort — Cancel reboot/shutdown\n\n' +
                '*AI & Tools:*\n' +
                '  /brain — Ghost Brain status\n' +
                '  /scan — Ralph visual scan pipeline\n' +
                '  /gate — Toggle remote access gate\n\n' +
                '*Chat:*\n' +
                '  Just type naturally to talk to Sage 🧠\n' +
                '  Send a voice note for hands-free input 🎤',
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.command('status', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            const os = require('os');
            const uptime = (process.uptime() / 3600).toFixed(1);
            const load = os.loadavg()[0].toFixed(2);
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const ramPct = ((totalMem - freeMem) / totalMem * 100).toFixed(1);
            const ramGB = ((totalMem - freeMem) / 1073741824).toFixed(1);
            const totalGB = (totalMem / 1073741824).toFixed(1);
            const aiMode = this.context?.aiHandler?.aiMode || 'unknown';

            ctx.reply(
                '📊 *SYSTEM STATUS*\n\n' +
                `🔋 Uptime: ${uptime}h\n` +
                `⚡ CPU Load: ${load}\n` +
                `💾 RAM: ${ramGB}/${totalGB} GB (${ramPct}%)\n` +
                `🧠 AI Mode: ${aiMode === 'groq' ? '☁️ Groq Cloud' : '🖥️ Ollama Local'}\n` +
                `👻 Runner: ✅ Online`,
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.command('lock', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            await this.bridge.from('ghost_bridge').insert({
                id: `tg_lock_${Date.now()}`, command: 'sys:lock',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
            ctx.reply('🔒 Workstation locked.');
        });

        this.bot.command('optimize', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            const cmdId = `tg_opt_${Date.now()}`;
            await this.bridge.from('ghost_bridge').insert({
                id: cmdId, command: 'sys:optimize',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
            ctx.sendChatAction('typing');
            this.pollForResponse(cmdId, ctx);
        });

        this.bot.command('prune', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            const cmdId = `tg_prune_${Date.now()}`;
            await this.bridge.from('ghost_bridge').insert({
                id: cmdId, command: 'sys:prune',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
            ctx.sendChatAction('typing');
            this.pollForResponse(cmdId, ctx);
        });

        this.bot.command('autopilot', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            const cmdId = `tg_autopilot_${Date.now()}`;
            await this.bridge.from('ghost_bridge').insert({
                id: cmdId, command: 'sys:autopilot',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
            ctx.reply('Running quick autopilot heal...');
            ctx.sendChatAction('typing');
            this.pollForResponse(cmdId, ctx);
        });

        this.bot.command('autopilotfull', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            const cmdId = `tg_autopilot_full_${Date.now()}`;
            await this.bridge.from('ghost_bridge').insert({
                id: cmdId, command: 'sys:autopilot_full',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
            ctx.reply('Running full autopilot heal...');
            ctx.sendChatAction('typing');
            this.pollForResponse(cmdId, ctx);
        });

        this.bot.command('maintoff', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            const cmdId = `tg_maint_off_${Date.now()}`;
            await this.bridge.from('ghost_bridge').insert({
                id: cmdId, command: 'sys:maintenance_exit',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
            ctx.reply('Maintenance mode disable requested.');
            ctx.sendChatAction('typing');
            this.pollForResponse(cmdId, ctx);
        });

        this.bot.command('maintenance', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            const cmdId = `tg_maint_${Date.now()}`;
            await this.bridge.from('ghost_bridge').insert({
                id: cmdId, command: 'sys:maintenance_window',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
            ctx.reply('Maintenance window started.');
            ctx.sendChatAction('typing');
            this.pollForResponse(cmdId, ctx);
        });

        this.bot.command('recover', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            const cmdId = `tg_recover_${Date.now()}`;
            await this.bridge.from('ghost_bridge').insert({
                id: cmdId, command: 'sys:emergency_recover',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
            ctx.reply('Emergency recover flow started.');
            ctx.sendChatAction('typing');
            this.pollForResponse(cmdId, ctx);
        });

        this.bot.command('reboot', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            ctx.reply('⚠️ *REBOOT INITIATED* — 30 second countdown.\nUse /abort to cancel.', { parse_mode: 'Markdown' });
            await this.bridge.from('ghost_bridge').insert({
                id: `tg_reboot_${Date.now()}`, command: 'sys:reboot',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
        });

        this.bot.command('shutdown', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            ctx.reply('⚠️ *SHUTDOWN INITIATED* — 30 second countdown.\nUse /abort to cancel.', { parse_mode: 'Markdown' });
            await this.bridge.from('ghost_bridge').insert({
                id: `tg_shutdown_${Date.now()}`, command: 'sys:shutdown',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
        });

        this.bot.command('abort', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            await this.bridge.from('ghost_bridge').insert({
                id: `tg_abort_${Date.now()}`, command: 'sys:abort_shutdown',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
            ctx.reply('✅ Power sequence aborted.');
        });

        this.bot.command('brain', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            try {
                const ghostBrain = require('../ghost-brain.cjs');
                const thought = ghostBrain.getLastThought();
                if (thought) {
                    ctx.reply(
                        '🧠 *GHOST BRAIN STATUS*\n\n' +
                        `📡 Think Cycle: #${thought.cycle}\n` +
                        `⏰ Last: ${thought.timestamp}\n` +
                        `⚡ CPU: ${thought.vitals.cpu}\n` +
                        `💾 RAM: ${thought.vitals.ram}%\n` +
                        `🤖 Ollama: ${thought.ollama}\n` +
                        (thought.services ? `\n*Services:*\n${Object.entries(thought.services).map(([k, v]) => `  ${v === 'online' ? '✅' : '❌'} ${k}: ${v}`).join('\n')}\n` : '') +
                        `\n🧹 Stale Cleared: ${thought.staleCleared}\n` +
                        `📋 Actions Taken: ${thought.actions}` +
                        (thought.insight ? `\n\n💡 *Insight:* ${thought.insight}` : ''),
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    ctx.reply('🧠 Ghost Brain is warming up. No thoughts yet.');
                }
            } catch (e) {
                ctx.reply('🧠 Ghost Brain module not loaded.');
            }
        });

        this.bot.command('scan', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            ctx.reply('🔍 *Ralph scanning...* Taking screenshot and analyzing.', { parse_mode: 'Markdown' });
            const cmdId = `tg_scan_${Date.now()}`;
            await this.bridge.from('ghost_bridge').insert({
                id: cmdId, command: 'ralph:scan',
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
            ctx.sendChatAction('typing');
            this.pollForResponse(cmdId, ctx);
        });

        this.bot.command('gate', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            // Toggle gate
            const cmdId = `tg_gate_${Date.now()}`;
            const isOpen = this.context?.gateStatus === 'online';
            const command = isOpen ? 'sys:close_gate' : 'sys:open_gate';
            await this.bridge.from('ghost_bridge').insert({
                id: cmdId, command,
                source: `telegram:${ctx.from.id}`, status: 'pending'
            });
            ctx.sendChatAction('typing');
            this.pollForResponse(cmdId, ctx);
        });

        // --- PHASE 15: /report — AI-generated daily system summary ---
        this.bot.command('report', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            ctx.reply('📊 Generating Matrix System Report...', { parse_mode: 'Markdown' });
            ctx.sendChatAction('typing');

            try {
                const os = require('os');
                const net = require('net');

                // Gather vitals
                const cpuLoad = os.loadavg()[0].toFixed(2);
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const ramPct = Math.round(((totalMem - freeMem) / totalMem) * 100);
                const uptimeH = (os.uptime() / 3600).toFixed(1);

                // Check service ports
                const checkPort = (port) => new Promise((resolve) => {
                    const s = new net.Socket();
                    s.setTimeout(2000);
                    s.on('connect', () => { s.destroy(); resolve(true); });
                    s.on('error', () => { s.destroy(); resolve(false); });
                    s.on('timeout', () => { s.destroy(); resolve(false); });
                    s.connect(port, '127.0.0.1');
                });

                const [reflect, nexus, ollama] = await Promise.all([
                    checkPort(3000), checkPort(3001), checkPort(11434)
                ]);

                // Recent bridge activity
                const { data: recentBridge } = await this.bridge
                    .from('ghost_bridge')
                    .select('command, status, source')
                    .order('created_at', { ascending: false })
                    .limit(10);

                const bridgeSummary = recentBridge
                    ? recentBridge.map(b => `${b.command} [${b.status}] from ${b.source}`).join('; ')
                    : 'No recent activity';

                // Send to Groq for analysis
                const apiKey = process.env.GROQ_API_KEY;
                if (!apiKey) {
                    ctx.reply('📊 *SYSTEM REPORT (Raw)*\n\n' +
                        `⚡ CPU: ${cpuLoad}\n💾 RAM: ${ramPct}%\n⏱ Uptime: ${uptimeH}h\n` +
                        `✅ Reflect: ${reflect ? 'online' : 'OFFLINE'}\n` +
                        `✅ Matrix Hub: ${nexus ? 'online' : 'OFFLINE'}\n` +
                        `🤖 Ollama: ${ollama ? 'online' : 'offline'}`,
                        { parse_mode: 'Markdown' }
                    );
                    return;
                }

                const snapshot = `System Report Request:
CPU Load: ${cpuLoad} | RAM: ${ramPct}% (${(freeMem / 1073741824).toFixed(1)}GB free / ${(totalMem / 1073741824).toFixed(1)}GB total)
Uptime: ${uptimeH} hours
Services: Reflect=${reflect ? 'UP' : 'DOWN'}, Matrix Hub=${nexus ? 'UP' : 'DOWN'}, Ollama=${ollama ? 'UP' : 'DOWN'}
Recent Bridge Activity (last 10): ${bridgeSummary}
Ghost Brain: Active`;

                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            { role: 'system', content: 'You are Sage, the Matrix system AI. Generate a brief but comprehensive system status report. Include health status, any concerns, and recommendations. Use emoji for visual clarity. Keep it under 200 words.' },
                            { role: 'user', content: snapshot }
                        ],
                        max_tokens: 400,
                        temperature: 0.4
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const report = data.choices[0].message.content.trim();
                    ctx.reply(`📊 *SAGE SYSTEM REPORT*\n\n${report}`, { parse_mode: 'Markdown' });
                } else {
                    ctx.reply('⚠️ Report generation failed. Groq API error.');
                }
            } catch (e) {
                ctx.reply(`❌ Report failed: ${e.message}`);
            }
        });

        // --- PHASE 22: /uptime — Historical system health ---
        this.bot.command('uptime', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            ctx.sendChatAction('typing');

            try {
                const { data: snapshots } = await this.bridge
                    .from('uptime_log')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(24); // ~6 hours at 15min intervals

                if (!snapshots || snapshots.length === 0) {
                    ctx.reply('📊 No uptime data yet. Ghost Brain needs to collect some snapshots first.');
                    return;
                }

                // Calculate averages
                const avgRam = (snapshots.reduce((a, s) => a + (s.ram_usage || 0), 0) / snapshots.length).toFixed(0);
                const avgCpu = (snapshots.reduce((a, s) => a + (s.cpu_load || 0), 0) / snapshots.length).toFixed(1);
                const healthyPct = ((snapshots.filter(s => s.all_healthy).length / snapshots.length) * 100).toFixed(0);
                const latest = snapshots[0];
                const oldest = snapshots[snapshots.length - 1];
                const spanHours = ((new Date(latest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 3600000).toFixed(1);

                // Text sparkline for RAM
                const bars = '▁▂▃▄▅▆▇█';
                const ramValues = snapshots.reverse().map(s => s.ram_usage || 0);
                const maxRam = Math.max(...ramValues, 1);
                const sparkline = ramValues.map(v => bars[Math.min(Math.floor((v / maxRam) * 8), 7)]).join('');

                // Service availability
                let serviceReport = '';
                if (latest.services) {
                    serviceReport = '\n*Service Status (latest):*\n' +
                        Object.entries(latest.services)
                            .map(([name, online]) => `  ${online ? '✅' : '❌'} ${name}`)
                            .join('\n');
                }

                ctx.reply(
                    `📊 *SYSTEM UPTIME REPORT*\n` +
                    `_Last ${spanHours}h (${snapshots.length} snapshots)_\n\n` +
                    `📈 RAM Trend: \`${sparkline}\`\n` +
                    `💾 Avg RAM: ${avgRam}% | ⚡ Avg CPU: ${avgCpu}\n` +
                    `🏥 Health Score: ${healthyPct}% uptime\n` +
                    `⏱ System Uptime: ${latest.uptime_hours?.toFixed(0) || '?'}h` +
                    serviceReport,
                    { parse_mode: 'Markdown' }
                );
            } catch (e) {
                ctx.reply(`❌ Uptime check failed: ${e.message}`);
            }
        });

        // --- MESSAGE HANDLER (All text) ---
        this.bot.on('text', async (ctx) => {
            if (!this.checkAuth(ctx)) return;

            const text = ctx.message.text;
            console.log(`[TELEGRAM] Incoming: "${text}" from ${ctx.from.username || ctx.from.id}`);

            // 1. Send "Typing..." action
            ctx.sendChatAction('typing');

            // 2. Inject into Ghost Bridge as a command
            // If it starts with a known prefix, keep it. Otherwise default to "sage:" chat.
            let command = text;
            const isSystemCmd = text.includes(':') || text === 'snap' || text === 'status';

            if (!isSystemCmd) {
                command = `sage: ${text}`;
            }

            const cmdId = `tg_${Date.now()}`;

            // 3. LISTEN FOR RESPONSE
            // We set up a one-time listener for this specific command ID
            const responseHandler = (payload) => {
                if (payload.new.id === cmdId && (payload.new.status === 'executed' || payload.new.status === 'failed')) {
                    const output = payload.new.output;
                    if (output) {
                        // Truncate if too long for Telegram
                        const replyText = output.length > 4000 ? output.substring(0, 4000) + '...' : output;
                        ctx.reply(replyText);
                    }
                    // Cleanup listener (handled by Supabase unsubscribe usually, but here we rely on the bridge flow)
                }
            };

            // Register temporary listener (This is tricky with global bridge, 
            // so instead we will just reply "Sent." and let Sage talk back via a separate channel if needed.
            // BETTER APPROACH: We just insert commands. Sage's `speak` or `notify` tools should be used for async replies.
            // BUT for direct chat, we want a reply. 
            // Let's rely on `ghost-runner`'s execution loop updating the record.

            const { error } = await this.bridge.from('ghost_bridge').insert({
                id: cmdId,
                command: command,
                source: `telegram:${ctx.from.id}`,
                status: 'pending',
                output: '' // Output will be filled by AiHandler/SysHandler
            });

            if (error) {
                ctx.reply(`❌ Transmission Failed: ${error.message}`);
            } else {
                // Poll for completion (Simple solution for now)
                this.pollForResponse(cmdId, ctx);
            }
        });

        // --- VOICE HANDLER ---
        this.bot.on('voice', async (ctx) => {
            if (!this.checkAuth(ctx)) return;
            console.log(`[TELEGRAM] Voice Note received from ${ctx.from.username}`);

            try {
                const fileId = ctx.message.voice.file_id;
                const fileLink = await ctx.telegram.getFileLink(fileId);

                // 1. Check for API Keys
                const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

                if (!apiKey) {
                    ctx.reply('🎤 Voice received. To enable Text-to-Speech, please add GROQ_API_KEY or OPENAI_API_KEY to .env.');
                    return;
                }

                ctx.sendChatAction('typing');

                // 2. Transcribe
                const transcription = await this.transcribeAudio(fileLink.href, apiKey);

                if (transcription) {
                    // Forward as text command
                    const command = (transcription.toLowerCase().includes('sage') || transcription.toLowerCase().includes('ralph') || transcription.includes(':'))
                        ? transcription
                        : `sage: ${transcription}`;

                    const cmdId = `tg_voice_${Date.now()}`;
                    ctx.reply(`🗣️ *Transcribed:* "${transcription}"`, { parse_mode: 'Markdown' });

                    await this.bridge.from('ghost_bridge').insert({
                        id: cmdId,
                        command: command,
                        source: `telegram_voice:${ctx.from.id}`,
                        status: 'pending'
                    });

                    this.pollForResponse(cmdId, ctx);
                } else {
                    ctx.reply('❌ Transcription failed.');
                }

            } catch (e) {
                console.error('[TELEGRAM] Voice Error:', e);
                ctx.reply(`❌ Voice Error: ${e.message}`);
            }
        });

        // --- ERROR HANDLING ---
        this.bot.catch((err) => {
            console.error('[TELEGRAM_ERROR]', err);
        });

        // --- LAUNCH ---
        this.bot.launch(() => {
            console.log('📡 [TELEGRAM] Bot Active & Listening...');
        }).catch(err => console.error('[TELEGRAM] Launch Failed:', err.message));

        // Graceful Stop
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }

    checkAuth(ctx) {
        if (!this.authorizedUser) return true; // Open if no user ID set
        if (String(ctx.from.id) === String(this.authorizedUser)) return true;

        console.warn(`[TELEGRAM] Unauthorized access attempt from ID: ${ctx.from.id} (${ctx.from.username})`);
        return false;
    }

    async pollForResponse(cmdId, ctx) {
        let attempts = 0;
        const maxAttempts = 30; // 30 * 500ms = 15s timeout

        const check = async () => {
            if (attempts >= maxAttempts) {
                return;
            }

            const { data } = await this.bridge.from('ghost_bridge')
                .select('status, output')
                .eq('id', cmdId)
                .single();

            if (data && (data.status === 'executed' || data.status === 'failed')) {
                let cleanOutput = data.output.replace(/^SAGE:\s*/i, '').replace(/^RALPH:\s*/i, '');
                try {
                    const parsed = JSON.parse(cleanOutput);
                    if (parsed?.command === 'sys:autopilot' || parsed?.command === 'sys:autopilot_full') {
                        const failed = Array.isArray(parsed?.summary?.failedChecks) ? parsed.summary.failedChecks : [];
                        cleanOutput =
                            `AUTOPILOT ${parsed.ok ? 'SUCCESS' : 'DEGRADED'}\n` +
                            `Mode: ${parsed.command === 'sys:autopilot_full' ? 'full' : 'quick'}\n` +
                            `Score: ${parsed?.summary?.healthScore ?? 'n/a'}\n` +
                            `Failed: ${failed.length ? failed.join(', ') : 'none'}`;
                    } else if (parsed?.command === 'sys:maintenance_window') {
                        cleanOutput =
                            `MAINTENANCE ${parsed.ok ? 'COMPLETE' : 'DEGRADED'}\n` +
                            `Paused: ${(parsed.paused || []).join(', ') || 'none'}\n` +
                            `Autopilot: ${parsed?.autopilot?.ok ? 'ok' : 'degraded'}\n` +
                            `Readiness: ${parsed?.readiness?.ok ? 'ok' : 'degraded'}`;
                    } else if (parsed?.command === 'sys:emergency_recover') {
                        cleanOutput =
                            `EMERGENCY RECOVER ${parsed.ok ? 'SUCCESS' : 'DEGRADED'}\n` +
                            `Maintenance: ${parsed?.maintenance?.ok ? 'ok' : 'degraded'}\n` +
                            `Post-heal: ${parsed?.postHeal?.ok ? 'ok' : 'degraded'}`;
                    }
                } catch (e) { }

                const fileMatch = cleanOutput.match(/FILE_READY:\s*(https?:\/\/[^\s]+)/);

                if (fileMatch) {
                    const imageUrl = fileMatch[1];
                    let remainingText = cleanOutput.replace(fileMatch[0], '').trim();

                    try {
                        if (remainingText.length > 0 && remainingText.length < 1000) {
                            await ctx.replyWithPhoto(imageUrl, { caption: remainingText });
                        } else {
                            await ctx.replyWithPhoto(imageUrl);
                            if (remainingText.length > 0) {
                                ctx.reply(remainingText);
                            }
                        }
                    } catch (e) {
                        ctx.reply(`🖼️ Image: ${imageUrl}\n\n${remainingText}`);
                    }
                    return;
                }

                if (cleanOutput.startsWith('{') && cleanOutput.endsWith('}')) {
                    try {
                        const json = JSON.parse(cleanOutput);
                        cleanOutput = `🤖 SYSTEM OUTPUT:\n\`\`\`json\n${JSON.stringify(json, null, 2)}\n\`\`\``;
                        ctx.reply(cleanOutput, { parse_mode: 'Markdown' });
                        return;
                    } catch (e) { }
                }

                ctx.reply(cleanOutput);
            } else {
                attempts++;
                setTimeout(check, 500);
            }
        };

        setTimeout(check, 500);
    }

    async execute(action, params) {
        if (!this.bot) return { success: false, error: 'Bot not initialized' };

        if (action === 'notify') {
            const message = params.message;
            if (!message) return { success: false, error: 'Message required' };

            const targetId = params.userId || this.authorizedUser;
            if (!targetId) {
                return { success: false, error: 'No recipient ID' };
            }

            try {
                await this.bot.telegram.sendMessage(targetId, message, { parse_mode: 'Markdown' });
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        return { success: false, error: 'Unknown action' };
    }

    async transcribeAudio(url, apiKey) {
        try {
            console.log(`[VOICE] Downloading audio from Telegram: ${url}`);

            // 1. Download the file via built-in fetch (Node 18+)
            const audioRes = await fetch(url);
            if (!audioRes.ok) throw new Error(`Failed to download audio: ${audioRes.statusText}`);

            const blob = await audioRes.blob();

            // 2. Construct FormData for Groq API
            const formData = new FormData();
            formData.append('file', blob, 'voice_message.ogg');
            formData.append('model', 'distil-whisper-large-v3-en');

            // 3. Send to Groq
            console.log('[VOICE] Sending to Groq API...');
            const endpoint = 'https://api.groq.com/openai/v1/audio/transcriptions';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Groq API Error (${res.status}): ${errorText}`);
            }

            const data = await res.json();
            return data.text;

        } catch (err) {
            console.error('[TRANSCRIPTION_FAIL]', err);
            return null;
        }
    }
}

module.exports = TelegramPlugin;
