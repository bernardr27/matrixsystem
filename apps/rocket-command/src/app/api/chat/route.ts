import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { matrixToolsSchema, executeMatrixTool } from '@/lib/ai/tools';

/* ═══════════════════════════════════════════════════════
   ANTIGRAVITY CHAT API v3.0
   Multi-provider (Groq / Google Gemini / Ollama)
   Streaming SSE + non-streaming modes
   Enhanced system context with tool awareness
   ═══════════════════════════════════════════════════════ */

type Provider = 'groq' | 'google' | 'ollama';

interface ChatMsg {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/* ── System Commands for AI Awareness ── */
const SYSTEM_COMMANDS = [
    'status:ports — Check listening ports (3000, 3001, 4000, 5173)',
    'status:processes — List running Node.js processes',
    'status:system — CPU, RAM, uptime overview',
    'status:disk — Disk space across all drives',
    'status:tunnels — Check Cloudflare tunnel processes',
    'tunnel:start — Launch Cloudflare Quick Tunnels for all apps',
    'tunnel:stop — Stop all active tunnels',
    'tunnel:urls — Show current tunnel URLs',
    'build:ghost — Build Ghost Command (port 5173)',
    'build:reflect — Build Reflect (port 3000)',
    'build:nexus — Build Nexus (port 3001)',
    'build:rocket — Build RocketCommand Pro (port 4000)',
    'health:full — Comprehensive system health check',
    'sage:scan — Sage environment diagnostics scan',
    'network:ping — Test connectivity to all Matrix services',
    'git:status — Git repository status',
    'git:log — Last 10 commits',
    'npm:audit — Run npm security audit',
    'kill:node — Stop all Node.js processes (⚠️ danger)',
    'kill:tunnels — Stop all tunnel processes (⚠️ danger)',
    'clear:cache — Clear .next build caches (⚠️ danger)',
];

/* ── Enrich Messages with System Context ── */
function enrichMessages(messages: ChatMsg[], context: any): ChatMsg[] {
    const telemetry = context
        ? `\n\nLive System Telemetry:
- Services: ${JSON.stringify(context.services || {})}
- CPU: ${context.cpu ?? 'N/A'}% | Memory: ${context.memory ?? 'N/A'}%
- Active Agent: ${context.agent || 'antigravity'}
- Active Tunnels: ${context.tunnels || 'none detected'}
- Stack: RocketCommand(4000), Ghost(5173), Reflect(3000), Nexus(3001), Ollama(11434)`
        : '';

    const tools = `\n\nAvailable System Commands (executable via /run <id>):
${SYSTEM_COMMANDS.join('\n')}

When suggesting system operations, reference these command IDs. Users can run them via slash commands in chat.
Format for suggesting: "Run \`/run status:ports\` to check port status."
You can also format code blocks with powershell/bash for manual execution.`;

    return messages.map((msg, i) => {
        if (i === 0 && msg.role === 'system') {
            return { ...msg, content: msg.content + telemetry + tools };
        }
        return msg;
    });
}

/* ═══ SSE Helper ═══ */
function sseEncode(data: object): Uint8Array {
    return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

function sseHeaders(): HeadersInit {
    return {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    };
}

/* ═══════════════════════════════════════════════════════
   PROVIDER: GROQ (LLaMA 3.3 / Mixtral)
   ═══════════════════════════════════════════════════════ */
async function chatGroq(messages: ChatMsg[], stream: boolean): Promise<Response> {
    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: 'GROQ_API_KEY not configured', setup: true, provider: 'groq' }, { status: 503 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const models = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama3-groq-70b-8192-tool-use-preview', 'mixtral-8x7b-32768'];

    let usedModel = models[0];
    let chatCompletion: any;
    let currentMessages = [...messages];

    // Tool execution loop (max 5 iterations to prevent infinite loops)
    for (let iteration = 0; iteration < 5; iteration++) {
        for (const model of models) {
            try {
                chatCompletion = await groq.chat.completions.create({
                    messages: currentMessages as any,
                    model,
                    temperature: 0.7,
                    max_tokens: 4096,
                    top_p: 0.9,
                    tools: matrixToolsSchema as any,
                    tool_choice: 'auto',
                });
                usedModel = model;
                break;
            } catch (err: unknown) {
                if (model === models[models.length - 1]) {
                    console.error('[Groq Error]', err);
                    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
                }
            }
        }

        const responseMessage = chatCompletion.choices[0]?.message;
        if (!responseMessage) {
            return NextResponse.json({ error: 'No response from Groq' }, { status: 500 });
        }

        // Check if the model wants to call a tool
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {

            // Append the assistant's request to call a tool to the history
            currentMessages.push(responseMessage);

            // Execute all requested tools in parallel
            for (const toolCall of responseMessage.tool_calls) {
                const funcName = toolCall.function.name;
                let args = {};
                try {
                    args = JSON.parse(toolCall.function.arguments);
                } catch { }

                console.log(`[Matrix AI] Executing tool: ${funcName}`, args);

                // Native execution mapped from tools.ts
                const result = await executeMatrixTool(funcName, args);

                // Append the result back to the LLM
                currentMessages.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: funcName,
                    content: result,
                } as any);
            }

            // Loop restarts: Call LLM again with the new tool output
            continue;
        }

        // No more tool calls, we have the final generated response
        return NextResponse.json({
            content: responseMessage.content || 'Task completed.',
            model: usedModel,
            provider: 'groq',
            usage: chatCompletion.usage,
            timestamp: new Date().toISOString(),
        });
    }

    // Max iterations reached
    return NextResponse.json({
        content: 'Matrix AI reached maximum autonomous execution limit (5 steps). Task aborted to prevent runaway recursion.',
        model: usedModel,
        provider: 'groq',
        timestamp: new Date().toISOString(),
    });
}

/* ═══════════════════════════════════════════════════════
   PROVIDER: GOOGLE GEMINI (gemini-2.0-flash / 1.5-flash)
   Direct API calls — no SDK dependency needed
   ═══════════════════════════════════════════════════════ */
async function chatGoogle(messages: ChatMsg[], stream: boolean): Promise<Response> {
    const apiKey = process.env.GOOGLE_AI_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'GOOGLE_AI_KEY not configured', setup: true, provider: 'google' }, { status: 503 });
    }

    const systemMsg = messages.find(m => m.role === 'system');
    const chatMsgs = messages.filter(m => m.role !== 'system');

    const body: any = {
        contents: chatMsgs.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        })),
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096, topP: 0.9 },
    };
    if (systemMsg) {
        body.system_instruction = { parts: [{ text: systemMsg.content }] };
    }

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];

    if (stream) {
        const readable = new ReadableStream({
            async start(controller) {
                let usedModel = models[0];
                let res: globalThis.Response | null = null;

                for (const model of models) {
                    try {
                        res = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
                            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
                        );
                        if (res.ok) { usedModel = model; break; }
                        res = null;
                    } catch {
                        if (model === models[models.length - 1]) {
                            controller.enqueue(sseEncode({ error: 'All Google models failed' }));
                            controller.close();
                            return;
                        }
                    }
                }

                if (!res || !res.ok || !res.body) {
                    const errText = res ? await res.text().catch(() => 'Unknown error') : 'No response';
                    controller.enqueue(sseEncode({ error: errText }));
                    controller.close();
                    return;
                }

                controller.enqueue(sseEncode({ meta: { model: usedModel, provider: 'google' } }));

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buf = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buf += decoder.decode(value, { stream: true });
                        const lines = buf.split('\n');
                        buf = lines.pop() || '';
                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue;
                            try {
                                const parsed = JSON.parse(line.slice(6));
                                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) controller.enqueue(sseEncode({ content: text }));
                            } catch { /* partial JSON, skip */ }
                        }
                    }
                } catch (err: unknown) {
                    controller.enqueue(sseEncode({ error: (err instanceof Error ? err.message : String(err)) }));
                }

                controller.enqueue(sseEncode({ done: true, model: usedModel, provider: 'google' }));
                controller.close();
            },
        });

        return new Response(readable, { headers: sseHeaders() });
    }

    // Non-streaming
    let data: any = null;
    let usedModel = models[0];
    for (const model of models) {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
            );
            if (res.ok) { data = await res.json(); usedModel = model; break; }
        } catch {
            if (model === models[models.length - 1]) throw new Error('All Google models failed');
        }
    }

    return NextResponse.json({
        content: data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.',
        model: usedModel,
        provider: 'google',
        timestamp: new Date().toISOString(),
    });
}

/* ═══════════════════════════════════════════════════════
   PROVIDER: OLLAMA (Local LLM — llama3, mistral, etc.)
   ═══════════════════════════════════════════════════════ */
async function chatOllama(messages: ChatMsg[], stream: boolean): Promise<Response> {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    try {
        const ping = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (!ping.ok) throw new Error();
    } catch {
        return NextResponse.json({
            error: 'Ollama not running — start with: ollama serve',
            setup: true,
            provider: 'ollama',
        }, { status: 503 });
    }

    const model = process.env.OLLAMA_MODEL || 'llama3';

    if (stream) {
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    const res = await fetch(`${ollamaUrl}/api/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model, messages, stream: true }),
                    });

                    if (!res.ok || !res.body) throw new Error('Ollama request failed');

                    controller.enqueue(sseEncode({ meta: { model, provider: 'ollama' } }));

                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();
                    let buf = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buf += decoder.decode(value, { stream: true });
                        const lines = buf.split('\n');
                        buf = lines.pop() || '';
                        for (const line of lines) {
                            if (!line.trim()) continue;
                            try {
                                const parsed = JSON.parse(line);
                                if (parsed.message?.content) {
                                    controller.enqueue(sseEncode({ content: parsed.message.content }));
                                }
                            } catch { /* partial */ }
                        }
                    }
                } catch (err: unknown) {
                    controller.enqueue(sseEncode({ error: (err instanceof Error ? err.message : String(err)) }));
                }

                controller.enqueue(sseEncode({ done: true, model, provider: 'ollama' }));
                controller.close();
            },
        });

        return new Response(readable, { headers: sseHeaders() });
    }

    // Non-streaming
    const res = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false }),
    });

    if (!res.ok) throw new Error('Ollama request failed');
    const data = await res.json();

    return NextResponse.json({
        content: data.message?.content || 'No response generated.',
        model,
        provider: 'ollama',
        timestamp: new Date().toISOString(),
    });
}

/* ═══════════════════════════════════════════════════════
   POST — Main Chat Handler
   ═══════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages, context, stream: useStream, provider: reqProvider } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
        }

        // Auto-detect best available provider
        const provider: Provider = reqProvider ||
            (process.env.GROQ_API_KEY ? 'groq' :
                process.env.GOOGLE_AI_KEY ? 'google' : 'ollama');

        const enrichedMessages = enrichMessages(messages, context);

        switch (provider) {
            case 'groq': return await chatGroq(enrichedMessages, !!useStream);
            case 'google': return await chatGoogle(enrichedMessages, !!useStream);
            case 'ollama': return await chatOllama(enrichedMessages, !!useStream);
            default:
                return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
        }
    } catch (error: unknown) {
        console.error('[Chat API Error]', (error instanceof Error ? error.message : String(error)) || error);
        return NextResponse.json(
            { error: 'AI processing failed', detail: (error instanceof Error ? error.message : String(error)) || 'Unknown error' },
            { status: 500 }
        );
    }
}

/* ═══════════════════════════════════════════════════════
   GET — AI Status & Provider Configuration
   Used by chat UI to detect available providers
   ═══════════════════════════════════════════════════════ */
export async function GET() {
    // Test Ollama availability
    let ollamaOnline = false;
    let ollamaModels: string[] = [];
    try {
        const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
            ollamaOnline = true;
            const data = await res.json();
            ollamaModels = (data.models || []).map((m: any) => m.name).slice(0, 10);
        }
    } catch { /* offline */ }

    const providers = {
        groq: {
            configured: !!process.env.GROQ_API_KEY,
            models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
            label: 'Groq Cloud',
            icon: '⚡',
        },
        google: {
            configured: !!process.env.GOOGLE_AI_KEY,
            models: ['gemini-2.0-flash', 'gemini-1.5-flash'],
            label: 'Google Gemini',
            icon: '🔮',
        },
        ollama: {
            configured: ollamaOnline,
            models: ollamaModels.length > 0 ? ollamaModels : ['llama3', 'mistral', 'codellama'],
            label: 'Ollama Local',
            icon: '🦙',
            local: true,
            online: ollamaOnline,
        },
    };

    const activeProvider = process.env.GROQ_API_KEY ? 'groq' : process.env.GOOGLE_AI_KEY ? 'google' : 'ollama';

    return NextResponse.json({
        providers,
        activeProvider,
        setup: {
            groq: { url: 'https://console.groq.com/keys', envVar: 'GROQ_API_KEY', envFile: '.env.local', free: true },
            google: { url: 'https://aistudio.google.com/apikey', envVar: 'GOOGLE_AI_KEY', envFile: '.env.local', free: true },
            ollama: { url: 'https://ollama.ai', local: true, free: true },
        },
        timestamp: new Date().toISOString(),
    });
}
