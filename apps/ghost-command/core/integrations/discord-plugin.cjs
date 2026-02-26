/**
 * Discord Integration Plugin
 * Handles standalone Discord.js Gateway connection, AI chat routing to ghost_bridge,
 * and Citadel SSO 2FA verification APIs.
 */

const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class DiscordPlugin {
    constructor() {
        this.name = 'discord';
        this.type = 'notification';
        this.rateLimit = 30; // Discord has stricter rate limits
        this.client = null;
        this.bridge = null;
        this.codes = {}; // Memory store for Citadel 2FA codes
    }

    async initialize(bridge, context) {
        this.bridge = bridge;
        const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

        if (!DISCORD_TOKEN) {
            console.error('❌ [DISCORD] Missing DISCORD_TOKEN in .env');
            return;
        }

        const SERVER_ID = process.env.DISCORD_SERVER_ID || '1474565186290450675';
        const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '1474565186290450678';
        const CITADEL_API = process.env.CITADEL_API || 'http://localhost:3005/api/discord-verify';

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages
            ],
            partials: [Partials.Channel]
        });

        this.client.on('ready', () => {
            console.log(`📡 [DISCORD] Bot Active & Listening as ${this.client.user.tag}`);
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;

            const isDM = message.channel.type === 1 || message.channel.type === 'DM' || !message.guild;
            const isAuthChannel = message.guildId === SERVER_ID && message.channelId === CHANNEL_ID;

            // Allow if it's a DM or the designated Matrix Auth Channel
            if (!isDM && !isAuthChannel) return;

            const text = message.content.trim();
            const lowerCode = text.toLowerCase();

            // Handle system admin overrides
            if (lowerCode === '!invalidateall' && message.member?.permissions?.has('Administrator')) {
                Object.keys(this.codes).forEach((c) => delete this.codes[c]);
                await message.reply('🧹 All codes invalidated.');
                return;
            }

            if (lowerCode === '!codes' && message.member?.permissions?.has('Administrator')) {
                const activeCodes = Object.keys(this.codes);
                await message.reply(`🔑 Active codes: ${activeCodes.length ? activeCodes.join(', ') : 'None'}`);
                return;
            }

            // 1. CITADEL SSO VERIFICATION PROTOCOL
            if (text.length >= 6 && this.codes[text]) { // Very generic check, assumes we stored the exact code
                try {
                    await axios.post(CITADEL_API, {
                        discordId: message.author.id,
                        code: text
                    });
                    await message.reply('✅ Success! You are verified for Citadel access.');
                    // Remove code
                    delete this.codes[text];
                } catch (e) {
                    await message.reply('❌ Verification failed. The Citadel instance may be offline or the code is invalid.');
                }
                return;
            }

            // Fallback for 6-character hex/alphanumeric code matching Citadel format
            if (/^[a-fA-F0-9]{6}$/.test(text) || /^[A-Z0-9]{8}$/.test(text)) {
                // Keep the codes in memory so `/run` or API endpoints can set them?
                // For now, Citadel actually expects the code to be verified over HTTP.
                // It's possible Citadel expects ANY code from here to be POSTed.
                try {
                    const res = await axios.post(CITADEL_API, {
                        discordId: message.author.id,
                        code: text
                    });
                    if (res.status === 200) {
                        await message.reply('✅ Success! You are verified for Citadel access.');
                        return;
                    }
                } catch (e) {
                    // Ignore, it might be a chat message. 
                }
            }

            // 2. GHOST COMMAND AI & EXECUTION ROUTING
            // Similar to Telegram: Insert all text into 'ghost_bridge' for Sage / system
            await message.channel.sendTyping();

            let command = text;
            const isSystemCmd = text.startsWith(':') || text.startsWith('!') || text.startsWith('/');

            if (!isSystemCmd) {
                command = `sage: ${text}`;
            } else if (text.startsWith('!')) {
                // Normalize legacy ! commands (e.g. !reboot -> sys:reboot)
                const mappedCmd = text.replace('!', '');
                if (['reboot', 'shutdown', 'abort', 'optimize', 'prune', 'lock', 'autopilot', 'autopilotfull', 'maintenance', 'recover'].includes(mappedCmd)) {
                    if (mappedCmd === 'autopilotfull') {
                        command = 'sys:autopilot_full';
                    } else if (mappedCmd === 'maintenance') {
                        command = 'sys:maintenance_window';
                    } else if (mappedCmd === 'recover') {
                        command = 'sys:emergency_recover';
                    } else {
                        command = `sys:${mappedCmd}`;
                    }
                } else if (mappedCmd === 'maintoff') {
                    command = 'sys:maintenance_exit';
                } else if (mappedCmd === 'autopilotstatus') {
                    command = 'sys:autopilot';
                } else if (['status'].includes(mappedCmd)) {
                    command = `sys:status`;
                } else {
                    command = text;
                }
            }

            const cmdId = `discord_${Date.now()}`;

            const { error } = await this.bridge.from('ghost_bridge').insert({
                id: cmdId,
                command: command,
                source: `discord:${message.author.id}:${message.channel.id}`,
                status: 'pending',
                output: ''
            });

            if (error) {
                await message.reply(`❌ Transmission Failed: ${error.message}`);
                return;
            }

            // Poll for completion output
            this.pollForResponse(cmdId, message.channel);
        });

        // Launch Client
        try {
            await this.client.login(DISCORD_TOKEN);
        } catch (err) {
            console.error('[DISCORD] Login Failed:', err.message);
        }

        // Graceful Stop
        process.once('SIGINT', () => this.client?.destroy());
        process.once('SIGTERM', () => this.client?.destroy());
    }

    async pollForResponse(cmdId, targetChannel) {
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

                // Handle Image Links emitted by Ralph
                const fileMatch = cleanOutput.match(/FILE_READY:\s*(https?:\/\/[^\s]+)/);

                if (fileMatch) {
                    const imageUrl = fileMatch[1];
                    let remainingText = cleanOutput.replace(fileMatch[0], '').trim();
                    try {
                        await targetChannel.send({ content: remainingText || '📷 Displaying Artifact', files: [imageUrl] });
                    } catch (e) {
                        await targetChannel.send(`🖼️ Image: ${imageUrl}\n\n${remainingText}`);
                    }
                    return;
                }

                // Handle JSON Outputs
                if (cleanOutput.startsWith('{') && cleanOutput.endsWith('}')) {
                    try {
                        const json = JSON.parse(cleanOutput);
                        cleanOutput = `\`\`\`json\n${JSON.stringify(json, null, 2)}\n\`\`\``;
                        await targetChannel.send(cleanOutput);
                        return;
                    } catch (e) { }
                }

                // Chunk large messages for Discord limits
                if (cleanOutput.length > 2000) {
                    const chunks = cleanOutput.match(/[\s\S]{1,1990}/g) || [];
                    for (const chunk of chunks) {
                        await targetChannel.send(chunk);
                    }
                } else {
                    if (cleanOutput.trim()) {
                        await targetChannel.send(cleanOutput);
                    }
                }
            } else {
                attempts++;
                setTimeout(check, 500);
            }
        };

        setTimeout(check, 500);
    }

    // Retained for Architect/Event Logger push notifications
    async execute(action, params, config) {
        if (!this.client || !this.client.isReady()) {
            // Fallback to webhook logic if the bot isn't fully initialized
            return await this.fallbackWebhook(action, params, config);
        }

        switch (action) {
            case 'notify':
            case 'send_message':
            case 'send':
                const userId = params.userId || process.env.DISCORD_OWNER_ID;
                if (!userId) return await this.fallbackWebhook(action, params, config);
                try {
                    const user = await this.client.users.fetch(userId);
                    await user.send(params.message);
                    return { sent: true, timestamp: Date.now() };
                } catch (err) {
                    console.error('[DISCORD] Send failed, falling back to webhook.', err);
                    return await this.fallbackWebhook(action, params, config);
                }
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    async fallbackWebhook(action, params, config) {
        const webhookUrl = config?.credentials?.webhook_url || process.env.DISCORD_WEBHOOK_URL;
        if (!webhookUrl) return { success: false, error: 'No Discord webhook or bot active.' };

        const { message, severity = 'info', title, fields = [], metrics = {} } = params;
        const color = this.getSeverityColor(severity);
        const icon = this.getSeverityIcon(severity);

        const embedFields = fields.map(f => ({
            name: String(f.title),
            value: String(f.value),
            inline: f.short !== false
        }));

        if (Object.keys(metrics).length > 0) {
            Object.entries(metrics).forEach(([key, value]) => {
                embedFields.push({ name: String(key), value: String(value), inline: true });
            });
        }

        const payload = {
            username: 'Matrix Intelligence',
            avatar_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=matrix',
            embeds: [{
                title: `${icon} ${title || 'System Alert'}`,
                description: message,
                color: parseInt(color.replace('#', ''), 16),
                fields: embedFields,
                footer: { text: 'Matrix System', icon_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=sage' },
                timestamp: new Date().toISOString()
            }]
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Discord API error: ${response.status} - ${error}`);
        }

        return { sent: true, timestamp: Date.now() };
    }

    getSeverityColor(severity) {
        const colors = {
            critical: '#DC2626', high: '#EA580C', warning: '#F59E0B',
            medium: '#10B981', info: '#3B82F6', low: '#6B7280'
        };
        return colors[severity] || colors.info;
    }

    getSeverityIcon(severity) {
        const icons = {
            critical: '🚨', high: '⚠️', warning: '⚡',
            medium: 'ℹ️', info: '💡', low: '📌'
        };
        return icons[severity] || icons.info;
    }
}

module.exports = DiscordPlugin;
