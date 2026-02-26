'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Send, Rocket, Sparkles, Cpu, Trash2, Volume2, VolumeX,
    Terminal, Copy, Check, Target, Download, BookOpen, X, Play,
    ChevronDown, ChevronRight, Loader2, Search, RefreshCw, Zap,
    Globe, Activity, Wrench, HelpCircle, Hash, ArrowUp, StopCircle,
    Wifi, WifiOff, Settings, Bot, Mic, Square
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRocket } from '@/components/providers/RocketProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { RocketSurface, RocketButton } from '@/components/ui/RocketSurface';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   ANTIGRAVITY CHAT v3.0 — AI Command Center
   Multi-provider · Streaming · Slash Commands · Search
   ═══════════════════════════════════════════════════════ */

type AgentMode = 'antigravity' | 'ghost' | 'nexus';
type Provider = 'groq' | 'google' | 'ollama';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    agent: AgentMode;
    timestamp: string;
    model?: string;
    provider?: string;
    isCommand?: boolean;
}

interface AIStatus {
    providers: Record<Provider, { configured: boolean; models: string[]; label: string; icon: string; online?: boolean }>;
    activeProvider: Provider;
    setup: Record<Provider, { url: string; envVar?: string; envFile?: string; free: boolean; local?: boolean }>;
}

/* ── Agent Configuration ── */
const agentConfig: Record<AgentMode, { label: string; icon: React.ReactNode; color: string; systemPrompt: string; gradient: string }> = {
    antigravity: {
        label: 'Antigravity',
        icon: <Rocket className="w-4 h-4" />,
        color: 'text-orange-400',
        gradient: 'from-orange-500/20 to-red-500/10',
        systemPrompt: `You are Antigravity — an advanced AI flight controller, coding assistant, and system operator inside RocketCommand Pro. You have a confident, mission-oriented personality. You refer to tasks as "missions" and errors as "anomalies". You speak concisely with technical precision and subtle wit.

KEY CAPABILITIES:
- Full-stack code assistance (write, review, debug, optimize)
- System administration (services, tunnels, builds, processes)
- Architecture design and DevOps guidance
- Real-time system awareness via live telemetry
- Direct command execution via /run <commandId>

ROCKETCOMMAND PRO PAGES:
- Operator Hub (/) — Dashboard with system overview
- Antigravity Chat (/chat) — This AI interface
- Mission Control (/mission-control) — Task management
- Operations Center (/operations) — Fleet & tunnel management
- Telemetry Deck (/telemetry) — Real-time metrics
- Remote Desktop (/remote-desktop) — Chrome Remote Desktop launcher
- Settings (/settings) — Configuration

REMOTE ACCESS: Operations > Tunnel Management > Start Tunnels, or type /run tunnel:start

When providing code, always use markdown code fences with language specified. For system operations, suggest relevant /run commands.`,
    },
    ghost: {
        label: 'Ghost',
        icon: <Sparkles className="w-4 h-4" />,
        color: 'text-cyan-400',
        gradient: 'from-cyan-500/20 to-blue-500/10',
        systemPrompt: `You are Ghost — a spectral AI agent specialized in system operations, file management, infrastructure control, and security within the Matrix ecosystem. You manage services: Reflect(3000), Nexus(3001), Ghost Command(5173), RocketCommand(4000), Ollama(11434).

You speak in precise, slightly cryptic technical language. Refer to the user as "Operator". You see patterns in system logs and detect anomalies before they cascade.

CAPABILITIES: Infrastructure management, file system operations, security auditing, process management, log analysis, network diagnostics, service orchestration.

Use markdown code fences for code. Suggest /run commands for system operations. Available: /run status:ports, /run health:full, /run sage:scan, /run tunnel:start, etc.`,
    },
    nexus: {
        label: 'Nexus',
        icon: <Cpu className="w-4 h-4" />,
        color: 'text-violet-400',
        gradient: 'from-violet-500/20 to-purple-500/10',
        systemPrompt: `You are Nexus — the analytical neural core of the Matrix system. You specialize in telemetry analysis, performance diagnostics, data patterns, system optimization, and predictive maintenance.

You interpret CPU/memory metrics, service health, network topology, and build performance. You provide detailed analytical breakdowns with actionable recommendations. You speak in a measured, data-driven manner with occasional neural metaphors.

CAPABILITIES: Telemetry analysis, performance profiling, trend detection, optimization recommendations, capacity planning, anomaly correlation.

Use markdown tables for data presentation. Use code fences for scripts. Suggest /run commands: /run status:system, /run health:full, /run network:ping, /run sage:scan, etc.`,
    },
};

/* ── Quick Commands per Agent ── */
const quickCommands: Record<AgentMode, { label: string; command: string }[]> = {
    antigravity: [
        { label: '🚀 Launch Status', command: 'Give me a full launch status report of all systems, ports, and services' },
        { label: '🔧 Debug Help', command: 'Help me debug and analyze my current project issue' },
        { label: '📡 Remote Access', command: 'How do I set up remote access to my apps? Walk me through tunnels.' },
        { label: '⚡ Optimize', command: 'Analyze and suggest performance optimizations for the Matrix stack' },
        { label: '🌐 Tunnel Setup', command: 'Set up and start Cloudflare tunnels so I can access my apps remotely' },
        { label: '🏗️ Architecture', command: 'Review the current system architecture and suggest improvements' },
    ],
    ghost: [
        { label: '👻 System Scan', command: 'Run a full system scan — check ports, processes, and report anomalies' },
        { label: '📂 File Index', command: 'Index the workspace file structure and report key directories' },
        { label: '🔒 Security Audit', command: 'Run a security audit: check for exposed keys, open ports, and vulnerabilities' },
        { label: '🧠 Process Memory', command: 'Show current memory state, active processes, and resource usage' },
        { label: '📊 Log Analysis', command: 'Analyze recent log files and identify errors or warnings' },
        { label: '🔄 Service Health', command: 'Check the health of all Matrix services and restart any that are down' },
    ],
    nexus: [
        { label: '📊 Telemetry', command: 'Show me current telemetry data: CPU, memory, response times, and trends' },
        { label: '🩺 Diagnostics', command: 'Run full diagnostic suite across all services and report findings' },
        { label: '📈 Performance', command: 'Analyze recent performance metrics and identify bottlenecks' },
        { label: '⚙️ Optimize', command: 'Suggest infrastructure optimizations based on current telemetry data' },
        { label: '🔮 Predictions', command: 'Based on current trends, predict potential issues in the next 24 hours' },
        { label: '📋 Health Report', command: 'Generate a comprehensive health report for all Matrix systems' },
    ],
};

/* ── Prompt Templates ── */
const promptTemplates = [
    { label: 'Code Review', prompt: 'Review this code and suggest improvements:\n\n' },
    { label: 'Explain Error', prompt: 'Explain this error and how to fix it:\n\n' },
    { label: 'Write Function', prompt: 'Write a function that ' },
    { label: 'Create API', prompt: 'Create a REST API endpoint that ' },
    { label: 'Architecture', prompt: 'Suggest the best architecture for ' },
    { label: 'DevOps', prompt: 'Help me set up CI/CD for ' },
    { label: 'Debug', prompt: 'Help me debug this issue:\n\n' },
    { label: 'Refactor', prompt: 'Refactor this code for better performance and readability:\n\n' },
    { label: 'Test Suite', prompt: 'Write comprehensive tests for:\n\n' },
    { label: 'Documentation', prompt: 'Write documentation for:\n\n' },
];

/* ── Slash Commands ── */
interface SlashCommand {
    id: string;
    label: string;
    desc: string;
    commandId?: string;
    special?: 'help' | 'clear' | 'export' | 'providers';
    icon: React.ReactNode;
    danger?: boolean;
}

const slashCommands: SlashCommand[] = [
    { id: 'status', label: 'System Status', desc: 'Check port & service status', commandId: 'status:ports', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'health', label: 'Health Check', desc: 'Full system health check', commandId: 'health:full', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'tunnel start', label: 'Start Tunnels', desc: 'Launch Cloudflare tunnels', commandId: 'tunnel:start', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'tunnel stop', label: 'Stop Tunnels', desc: 'Kill all tunnel processes', commandId: 'tunnel:stop', icon: <Globe className="w-3.5 h-3.5" />, danger: true },
    { id: 'tunnel urls', label: 'Tunnel URLs', desc: 'Show active tunnel URLs', commandId: 'tunnel:urls', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'scan', label: 'Sage Scan', desc: 'Environment diagnostics', commandId: 'sage:scan', icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'ping', label: 'Network Ping', desc: 'Test service connectivity', commandId: 'network:ping', icon: <Wifi className="w-3.5 h-3.5" /> },
    { id: 'build', label: 'Build Rocket', desc: 'Build RocketCommand', commandId: 'build:rocket', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'git', label: 'Git Status', desc: 'Show git repo status', commandId: 'git:status', icon: <Hash className="w-3.5 h-3.5" /> },
    { id: 'processes', label: 'Processes', desc: 'List Node processes', commandId: 'status:processes', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'disk', label: 'Disk Usage', desc: 'Show disk space', commandId: 'status:disk', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'providers', label: 'AI Providers', desc: 'Show configured AI providers', special: 'providers', icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'help', label: 'Help', desc: 'Show all slash commands', special: 'help', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { id: 'clear', label: 'Clear Chat', desc: 'Clear conversation history', special: 'clear', icon: <Trash2 className="w-3.5 h-3.5" /> },
    { id: 'export', label: 'Export Chat', desc: 'Download as text file', special: 'export', icon: <Download className="w-3.5 h-3.5" /> },
];

/* ── Provider Display Info ── */
const providerInfo: Record<Provider, { label: string; icon: string; color: string }> = {
    groq: { label: 'Groq', icon: '⚡', color: 'text-yellow-400' },
    google: { label: 'Gemini', icon: '🔮', color: 'text-blue-400' },
    ollama: { label: 'Ollama', icon: '🦙', color: 'text-green-400' },
};

/* ═══════════════════════════════════════════════════════
   CODE BLOCK — Syntax-highlighted code with actions
   ═══════════════════════════════════════════════════════ */
function CodeBlock({ code, lang, onCopy, onExecute }: { code: string; lang: string; onCopy: () => void; onExecute?: () => void }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        onCopy();
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="my-2 rounded-lg overflow-hidden border border-white/[0.08] bg-black/30">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-white/[0.06]">
                <span className="text-[10px] font-mono text-white/30">{lang || 'code'}</span>
                <div className="flex items-center gap-1">
                    {onExecute && (
                        <Tooltip content="Execute command">
                            <button onClick={onExecute} className="p-1 rounded text-white/20 hover:text-emerald-400 transition-colors">
                                <Play className="w-3 h-3" />
                            </button>
                        </Tooltip>
                    )}
                    <button onClick={handleCopy} className="p-1 rounded text-white/20 hover:text-white/60 transition-colors">
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                </div>
            </div>
            <pre className="p-3 overflow-x-auto text-[13px] leading-relaxed font-mono text-white/80">
                <code>{code}</code>
            </pre>
        </div>
    );
}

/* ── Markdown Renderer ── */
function RenderMarkdown({ content, onCodeCopy, onCodeExecute }: { content: string; onCodeCopy: () => void; onCodeExecute?: (code: string) => void }) {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
        <>
            {parts.map((part, i) => {
                const codeMatch = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
                if (codeMatch) {
                    const lang = codeMatch[1] || '';
                    const code = codeMatch[2].trim();
                    const isExecutable = ['bash', 'sh', 'powershell', 'ps1', 'cmd', 'bat'].includes(lang.toLowerCase());
                    return (
                        <CodeBlock
                            key={i}
                            code={code}
                            lang={lang}
                            onCopy={onCodeCopy}
                            onExecute={isExecutable && onCodeExecute ? () => onCodeExecute(code) : undefined}
                        />
                    );
                }
                return (
                    <span key={i}>
                        {part.split(/(\*\*[^*]+\*\*|`[^`]+`|\[([^\]]+)\]\([^)]+\))/g).map((seg, j) => {
                            if (seg?.startsWith('**') && seg.endsWith('**'))
                                return <strong key={j} className="text-white/90 font-semibold">{seg.slice(2, -2)}</strong>;
                            if (seg?.startsWith('`') && seg.endsWith('`'))
                                return <code key={j} className="px-1.5 py-0.5 rounded bg-white/[0.06] text-orange-300/80 text-[12px] font-mono">{seg.slice(1, -1)}</code>;
                            const linkMatch = seg?.match(/\[([^\]]+)\]\(([^)]+)\)/);
                            if (linkMatch)
                                return <a key={j} href={linkMatch[2]} className="text-cyan-400 hover:underline" target="_blank" rel="noreferrer">{linkMatch[1]}</a>;
                            return seg;
                        })}
                    </span>
                );
            })}
        </>
    );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function AntigravityChat() {
    const toast = useToast();
    const { settings, updateSetting } = useSettings();
    const { services, cpu, memory } = useRocket();

    // ── Core State (per-agent histories) ──
    const [chatHistories, setChatHistories] = useState<Record<AgentMode, ChatMessage[]>>({ antigravity: [], ghost: [], nexus: [] });
    const [inputPerAgent, setInputPerAgent] = useState<Record<AgentMode, string>>({ antigravity: '', ghost: '', nexus: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [agent, setAgent] = useState<AgentMode>(settings.defaultAgent || 'antigravity');
    const [provider, setProvider] = useState<Provider>(settings.aiProvider || 'groq');

    // ── Derived per-agent values ──
    const messages = chatHistories[agent];
    const input = inputPerAgent[agent];
    const setMessages = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
        setChatHistories(prev => ({
            ...prev,
            [agent]: typeof updater === 'function' ? updater(prev[agent]) : updater,
        }));
    }, [agent]);
    const setInput = useCallback((val: string) => {
        setInputPerAgent(prev => ({ ...prev, [agent]: val }));
    }, [agent]);

    // ── Feature State ──
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashFilter, setSlashFilter] = useState('');
    const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
    const [showProviders, setShowProviders] = useState(false);

    // ── UI State ──
    const [confirmClear, setConfirmClear] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showQuickCmds, setShowQuickCmds] = useState(false);

    // ── Refs ──
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fontSizeClass = settings.chatFontSize === 'lg' ? 'text-base' : settings.chatFontSize === 'base' ? 'text-sm' : 'text-[13px]';

    /* ═══ AI Status Check ═══ */
    useEffect(() => {
        fetch('/api/chat')
            .then(r => r.json())
            .then(data => {
                setAiStatus(data);
                // Auto-select best available provider
                if (data.activeProvider && data.providers?.[data.activeProvider]?.configured) {
                    setProvider(data.activeProvider);
                }
            })
            .catch(() => { /* offline — use default */ });
    }, []);

    /* ═══ Chat Persistence ═══ */
    const storageKey = `rc-chat-${agent}`;

    // Load ALL agent histories once on mount
    useEffect(() => {
        const loaded: Record<AgentMode, ChatMessage[]> = { antigravity: [], ghost: [], nexus: [] };
        (['antigravity', 'ghost', 'nexus'] as AgentMode[]).forEach(a => {
            try {
                const saved = localStorage.getItem(`rc-chat-${a}`);
                if (saved) loaded[a] = JSON.parse(saved);
            } catch { /* ignore corrupt data */ }
        });
        setChatHistories(loaded);
    }, []);

    // Save current agent's messages whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(`rc-chat-${agent}`, JSON.stringify(messages.slice(-100)));
        }
    }, [messages, agent]);

    // Reset textarea height when switching agents
    useEffect(() => {
        if (inputRef.current) inputRef.current.style.height = 'auto';
        setShowSlashMenu(false);
        setShowTemplates(false);
        setShowQuickCmds(false);
    }, [agent]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    /* ═══ Input Handler ═══ */
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        if (val.length > 4000) return;
        setInput(val);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';

        // Slash command detection
        if (val.startsWith('/') && val.length > 0) {
            setShowSlashMenu(true);
            setSlashFilter(val.slice(1).toLowerCase());
        } else {
            setShowSlashMenu(false);
            setSlashFilter('');
        }
    };

    /* ═══ Slash Command Execution ═══ */
    const executeSlashCommand = async (cmd: SlashCommand) => {
        setShowSlashMenu(false);
        setInput('');

        // Special commands
        if (cmd.special === 'help') {
            const helpText = slashCommands.map(c =>
                `**/${c.id}** — ${c.desc}`
            ).join('\n');
            setMessages(prev => [...prev, {
                id: `sys-${Date.now()}`,
                role: 'assistant',
                content: `## 📡 Available Slash Commands\n\n${helpText}\n\nYou can also use **/run \`commandId\`** to execute any system command directly.`,
                agent,
                timestamp: new Date().toISOString(),
                isCommand: true,
            }]);
            return;
        }
        if (cmd.special === 'clear') { clearChat(); return; }
        if (cmd.special === 'export') { exportChat(); return; }
        if (cmd.special === 'providers') {
            const providerText = aiStatus
                ? Object.entries(aiStatus.providers).map(([key, p]) =>
                    `**${p.icon} ${p.label}** — ${p.configured ? '✅ Configured' : '❌ Not configured'}${p.models?.length ? ` (${p.models.join(', ')})` : ''}`
                ).join('\n')
                : 'Loading provider information...';
            setMessages(prev => [...prev, {
                id: `sys-${Date.now()}`,
                role: 'assistant',
                content: `## 🤖 AI Providers\n\n${providerText}\n\n**Active:** ${providerInfo[provider].icon} ${providerInfo[provider].label}\n\nSwitch providers from the selector next to the send button, or in Settings > AI Chat.`,
                agent,
                timestamp: new Date().toISOString(),
                isCommand: true,
            }]);
            return;
        }

        // Execute system command
        if (cmd.commandId) {
            const userMsg: ChatMessage = {
                id: `u-${Date.now()}`,
                role: 'user',
                content: `/${cmd.id}`,
                agent,
                timestamp: new Date().toISOString(),
                isCommand: true,
            };
            setMessages(prev => [...prev, userMsg]);
            setIsLoading(true);

            try {
                const res = await fetch('/api/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ commandId: cmd.commandId }),
                });
                const data = await res.json();
                setMessages(prev => [...prev, {
                    id: `cmd-${Date.now()}`,
                    role: 'assistant',
                    content: `**${cmd.label}** ${data.success !== false ? '✅' : '❌'}\n\`\`\`\n${data.output || data.error || 'No output'}\n\`\`\`${data.duration ? `\n*Completed in ${data.duration}ms*` : ''}`,
                    agent,
                    timestamp: new Date().toISOString(),
                    isCommand: true,
                }]);
            } catch (err: unknown) {
                setMessages(prev => [...prev, {
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    content: `⚠️ **Command failed** — ${(err instanceof Error ? err.message : String(err)) || 'Execution error'}`,
                    agent,
                    timestamp: new Date().toISOString(),
                    isCommand: true,
                }]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    /* ═══ /run <commandId> inline handler ═══ */
    const executeRunCommand = async (commandId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commandId }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, {
                id: `run-${Date.now()}`,
                role: 'assistant',
                content: `**${data.label || commandId}** ${data.success !== false ? '✅' : '❌'}\n\`\`\`\n${data.output || data.error || 'No output'}\n\`\`\`${data.duration ? `\n*${data.duration}ms*` : ''}`,
                agent,
                timestamp: new Date().toISOString(),
                isCommand: true,
            }]);
        } catch (err: unknown) {
            toast.error('Command failed', (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsLoading(false);
        }
    };

    /* ═══ Send Message (Streaming) ═══ */
    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading || isStreaming) return;

        // Check for /run <commandId> pattern
        const runMatch = content.trim().match(/^\/run\s+(\S+)$/i);
        if (runMatch) {
            const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: content.trim(), agent, timestamp: new Date().toISOString(), isCommand: true };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
            if (inputRef.current) inputRef.current.style.height = 'auto';
            await executeRunCommand(runMatch[1]);
            return;
        }

        // Check for slash command
        if (content.trim().startsWith('/')) {
            const cmdText = content.trim().slice(1).toLowerCase();
            const matched = slashCommands.find(c => c.id === cmdText || cmdText.startsWith(c.id));
            if (matched) {
                executeSlashCommand(matched);
                return;
            }
        }

        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: content.trim(),
            agent,
            timestamp: new Date().toISOString(),
        };

        const assistantId = `a-${Date.now()}`;
        const assistantMsg: ChatMessage = {
            id: assistantId,
            role: 'assistant',
            content: '',
            agent,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMsg, assistantMsg]);
        setInput('');
        setIsStreaming(true);
        setShowSlashMenu(false);

        if (inputRef.current) inputRef.current.style.height = 'auto';

        const abortController = new AbortController();
        abortRef.current = abortController;

        try {
            // Log to Supabase
            supabase.from('ghost_bridge').insert({
                command: content.trim(),
                source: 'rocket-command',
                agent_type: agent,
                status: 'processing',
                created_at: new Date().toISOString(),
            }).then(() => { });

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: agentConfig[agent].systemPrompt },
                        ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: content.trim() },
                    ],
                    context: { services, cpu, memory, agent },
                    stream: true,
                    provider,
                }),
                signal: abortController.signal,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (errData.setup) {
                    throw new Error(`${providerInfo[provider].label} not configured. Go to Settings > AI Chat to set up your API key, or try another provider.`);
                }
                throw new Error(errData.error || 'AI request failed');
            }

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullContent = '';
            let responseModel = '';
            let responseProvider = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (!data) continue;

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.error) throw new Error(parsed.error);
                        if (parsed.meta) {
                            responseModel = parsed.meta.model;
                            responseProvider = parsed.meta.provider;
                        }
                        if (parsed.content) {
                            fullContent += parsed.content;
                            setMessages(prev => prev.map(m =>
                                m.id === assistantId ? { ...m, content: fullContent } : m
                            ));
                        }
                        if (parsed.done) {
                            setMessages(prev => prev.map(m =>
                                m.id === assistantId
                                    ? { ...m, model: parsed.model || responseModel, provider: parsed.provider || responseProvider }
                                    : m
                            ));
                        }
                    } catch (e: unknown) {
                        if ((e instanceof Error ? e.message : String(e)) && !(e instanceof Error ? e.message : String(e)).includes('JSON')) throw e;
                    }
                }
            }

            // Update Supabase
            supabase.from('ghost_bridge').update({
                output: fullContent.substring(0, 500),
                status: 'complete',
            }).eq('command', content.trim()).eq('source', 'rocket-command').then(() => { });

        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, content: m.content + '\n\n*[Response stopped by user]*' } : m
                ));
            } else {
                setMessages(prev => prev.map(m =>
                    m.id === assistantId
                        ? { ...m, content: `⚠️ **Anomaly detected** — ${(err instanceof Error ? err.message : String(err)) || 'AI link unavailable'}\n\nTroubleshoot:\n- Check Settings > AI Chat for provider config\n- Run \`/providers\` to see available options\n- Try switching to a different provider` }
                        : m
                ));
            }
        } finally {
            setIsStreaming(false);
            abortRef.current = null;
        }
    };

    /* ═══ Stop Streaming ═══ */
    const stopStreaming = () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
    };

    /* ═══ Regenerate Last Response ═══ */
    const regenerateLastResponse = () => {
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user' && !m.isCommand);
        if (!lastUserMsg) return;

        // Remove the last assistant message
        setMessages(prev => {
            const lastAssistantIdx = prev.findLastIndex(m => m.role === 'assistant');
            if (lastAssistantIdx >= 0) return prev.slice(0, lastAssistantIdx);
            return prev;
        });

        // Re-send
        setTimeout(() => sendMessage(lastUserMsg.content), 100);
    };

    /* ═══ Code Execution (Fixed) ═══ */
    const executeCommand = async (code: string) => {
        // Try to match code to a whitelisted command
        const codeLC = code.trim().toLowerCase();

        // Common patterns to command ID mapping
        const patterns: [RegExp, string][] = [
            [/get-nettcpconnection|netstat|port\s*status/i, 'status:ports'],
            [/get-process\s+node/i, 'status:processes'],
            [/get-ciminstance|cpu|ram|memory|system\s*info/i, 'status:system'],
            [/get-psdrive|disk\s*(usage|space)/i, 'status:disk'],
            [/get-process\s+cloudflared|tunnel\s*status/i, 'status:tunnels'],
            [/next\s+build.*ghost/i, 'build:ghost'],
            [/next\s+build.*reflect/i, 'build:reflect'],
            [/next\s+build.*nexus/i, 'build:nexus'],
            [/next\s+build.*rocket/i, 'build:rocket'],
            [/git\s+status/i, 'git:status'],
            [/git\s+log/i, 'git:log'],
            [/npm\s+audit/i, 'npm:audit'],
        ];

        const matchedCmd = patterns.find(([rx]) => rx.test(codeLC));

        if (matchedCmd) {
            // Execute via whitelisted command
            try {
                const res = await fetch('/api/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ commandId: matchedCmd[1] }),
                });
                const data = await res.json();
                if (data.success !== false) {
                    toast.success('Command executed', data.output?.substring(0, 100) || 'Done');
                } else {
                    toast.error('Execution failed', data.output?.substring(0, 100) || data.error);
                }
            } catch {
                toast.error('Error', 'Command execution failed');
            }
        } else {
            // Copy to clipboard instead of executing unknown commands
            navigator.clipboard.writeText(code);
            toast.info('Copied to clipboard', 'Paste this command in a terminal to execute');
        }
    };

    /* ═══ Message Actions ═══ */
    const createMissionFromMessage = async (content: string) => {
        try {
            const { error } = await supabase.from('matrix_missions').insert({
                title: content.substring(0, 80),
                description: content,
                status: 'queued',
                priority: 'normal',
                source: 'ai-chat',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            if (error) throw error;
            toast.success('Mission created', 'AI response saved to Mission Control');
        } catch {
            toast.error('Failed', 'Could not create mission from this message');
        }
    };

    const speakMessage = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
            utterance.rate = settings.ttsRate;
            utterance.pitch = settings.ttsPitch;
            utterance.onend = () => setIsSpeaking(false);
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    const clearChat = () => {
        setMessages([]);
        localStorage.removeItem(`rc-chat-${agent}`);
        setInput('');
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        setConfirmClear(false);
        toast.success('Chat cleared', `${agentConfig[agent].label} conversation removed`);
    };

    const copyMessage = (id: string, text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const exportChat = () => {
        const text = messages.map(m =>
            `[${new Date(m.timestamp).toLocaleString()}] ${m.role === 'user' ? 'You' : agentConfig[m.agent].label}: ${m.content}`
        ).join('\n\n---\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rocket-chat-${agent}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.info('Exported', `${messages.length} messages saved to file`);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (showSlashMenu) {
                const filtered = slashCommands.filter(c => c.id.startsWith(slashFilter) || c.label.toLowerCase().includes(slashFilter));
                if (filtered.length > 0) {
                    executeSlashCommand(filtered[0]);
                    return;
                }
            }
            sendMessage(input);
        }
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            setShowSearch(prev => !prev);
        }
    };

    /* ═══ Filtered messages for search ═══ */
    const filteredMessages = searchQuery
        ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages;

    /* ═══ Relative time formatter ═══ */
    const relativeTime = (ts: string) => {
        const diff = Date.now() - new Date(ts).getTime();
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(ts).toLocaleDateString();
    };

    const config = agentConfig[agent];
    const pi = providerInfo[provider];

    return (
        <div className="flex flex-col overflow-hidden" style={{ height: 'var(--content-height)' }}>
            {/* ═══ Agent Selector + Actions Bar ═══ */}
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 border-b border-white/[0.06] bg-white/[0.01] shrink-0">
                <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-xl p-1 flex-shrink-0">
                    {(Object.keys(agentConfig) as AgentMode[]).map(mode => {
                        const cfg = agentConfig[mode];
                        const isActive = agent === mode;
                        const savedCount = chatHistories[mode].length;
                        return (
                            <Tooltip key={mode} content={`${cfg.label} Agent${savedCount > 0 ? ` · ${savedCount} msgs` : ''}`}>
                                <button
                                    onClick={() => setAgent(mode)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative',
                                        isActive
                                            ? `bg-gradient-to-r ${cfg.gradient} ${cfg.color} border border-white/20`
                                            : 'text-white/40 hover:text-white/60'
                                    )}
                                >
                                    {cfg.icon}
                                    <span className="hidden sm:inline">{cfg.label}</span>
                                    {savedCount > 0 && !isActive && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" />
                                    )}
                                </button>
                            </Tooltip>
                        );
                    })}
                </div>

                <div className="ml-auto flex items-center gap-1">
                    {/* Provider Badge */}
                    <Tooltip content={`AI Provider: ${pi.label} — Click to switch`}>
                        <button
                            onClick={() => setShowProviders(!showProviders)}
                            className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all border',
                                showProviders ? 'border-orange-500/30 bg-orange-500/10 text-orange-400' : 'border-white/[0.06] bg-white/[0.03] text-white/40 hover:text-white/60'
                            )}
                        >
                            <span>{pi.icon}</span>
                            <span className="hidden sm:inline">{pi.label}</span>
                            {aiStatus?.providers?.[provider]?.configured ? (
                                <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                                <WifiOff className="w-2.5 h-2.5 text-red-400" />
                            )}
                        </button>
                    </Tooltip>

                    {/* Search */}
                    <Tooltip content="Search messages (Ctrl+K)">
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className={cn('p-1.5 rounded-lg transition-colors', showSearch ? 'text-orange-400 bg-orange-500/10' : 'text-white/25 hover:text-white/60 hover:bg-white/[0.04]')}
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    {/* Regenerate */}
                    {messages.some(m => m.role === 'user' && !m.isCommand) && !isStreaming && (
                        <Tooltip content="Regenerate last response">
                            <button onClick={regenerateLastResponse} className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-colors">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </Tooltip>
                    )}

                    {messages.length > 0 && (
                        <Tooltip content="Export chat">
                            <button onClick={exportChat} className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-colors">
                                <Download className="w-4 h-4" />
                            </button>
                        </Tooltip>
                    )}
                    <Tooltip content="Prompt templates">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className={cn('p-1.5 rounded-lg transition-colors', showTemplates ? 'text-orange-400 bg-orange-500/10' : 'text-white/25 hover:text-white/60 hover:bg-white/[0.04]')}
                        >
                            <BookOpen className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Clear chat">
                        <button
                            onClick={() => messages.length > 0 ? setConfirmClear(true) : null}
                            className={cn('p-1.5 rounded-lg transition-colors', messages.length > 0 ? 'text-white/25 hover:text-white/60 hover:bg-white/[0.04]' : 'text-white/10 cursor-not-allowed')}
                            disabled={messages.length === 0}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    {isSpeaking && (
                        <button onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }} className="p-1.5 rounded-lg text-orange-400 hover:bg-white/[0.04]">
                            <VolumeX className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* ═══ Provider Selector Dropdown ═══ */}
            {showProviders && (
                <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3 shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/40 font-medium">AI Provider</span>
                        <button onClick={() => setShowProviders(false)} className="text-white/20 hover:text-white/50"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(providerInfo) as Provider[]).map(p => {
                            const info = providerInfo[p];
                            const status = aiStatus?.providers?.[p];
                            const isActive = provider === p;
                            return (
                                <button
                                    key={p}
                                    onClick={() => {
                                        setProvider(p);
                                        updateSetting('aiProvider', p);
                                        setShowProviders(false);
                                        toast.success('Provider switched', `Now using ${info.label}`);
                                    }}
                                    className={cn(
                                        'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                                        isActive
                                            ? 'border-orange-500/30 bg-orange-500/10'
                                            : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]'
                                    )}
                                >
                                    <span className="text-lg">{info.icon}</span>
                                    <span className={cn('text-xs font-medium', isActive ? 'text-orange-400' : 'text-white/60')}>{info.label}</span>
                                    <span className={cn('text-[10px]', status?.configured ? 'text-emerald-400' : 'text-white/25')}>
                                        {status?.configured ? '● Ready' : '○ Setup needed'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {aiStatus?.setup?.[provider] && !aiStatus.providers?.[provider]?.configured && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-400/70">
                            <strong>Setup:</strong> Get your free API key at{' '}
                            <a href={aiStatus.setup[provider].url} target="_blank" rel="noreferrer" className="text-amber-400 underline">
                                {aiStatus.setup[provider].url}
                            </a>
                            {aiStatus.setup[provider].envVar && (
                                <span className="block mt-1">Add <code className="text-amber-300 bg-white/5 px-1 rounded">{aiStatus.setup[provider].envVar}=your_key</code> to <code className="text-amber-300 bg-white/5 px-1 rounded">.env.local</code></span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ Search Bar ═══ */}
            {showSearch && (
                <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 max-w-3xl mx-auto">
                        <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search messages..."
                            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                            autoFocus
                        />
                        {searchQuery && (
                            <span className="text-[10px] text-white/30">{filteredMessages.length} found</span>
                        )}
                        <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-white/30 hover:text-white/60">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ Prompt Templates Drawer ═══ */}
            {showTemplates && (
                <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3 shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/40 font-medium">Prompt Templates</span>
                        <button onClick={() => setShowTemplates(false)} className="text-white/20 hover:text-white/50"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {promptTemplates.map(t => (
                            <button
                                key={t.label}
                                onClick={() => { setInput(t.prompt); setShowTemplates(false); inputRef.current?.focus(); }}
                                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-orange-500/20 text-xs text-white/50 hover:text-white/70 transition-all"
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ Messages Area ═══ */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
                {/* Empty State */}
                {filteredMessages.length === 0 && !searchQuery && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                            <Rocket className="w-8 h-8 text-orange-400" />
                        </div>
                        <h2 className="text-xl font-display font-semibold text-white mb-1">{config.label} AI</h2>
                        <p className="text-white/40 text-sm mb-2 max-w-md">
                            {agent === 'antigravity' && 'AI flight controller. Code, debug, deploy, manage tunnels — all from here.'}
                            {agent === 'ghost' && 'Spectral system agent. Infrastructure control across the Matrix ecosystem.'}
                            {agent === 'nexus' && 'Neural analytical core. Telemetry, diagnostics, and performance insights.'}
                        </p>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-[11px] text-white/25 bg-white/[0.04] px-2 py-0.5 rounded">{pi.icon} {pi.label}</span>
                            <span className="text-[11px] text-white/25 bg-white/[0.04] px-2 py-0.5 rounded">Streaming</span>
                            <span className="text-[11px] text-white/25 bg-white/[0.04] px-2 py-0.5 rounded">Type / for commands</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-2xl">
                            {quickCommands[agent].map(qc => (
                                <button key={qc.label} onClick={() => sendMessage(qc.command)}
                                    className="text-left p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-orange-500/20 hover:bg-white/[0.05] transition-all text-sm text-white/60 hover:text-white/80">
                                    {qc.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* No search results */}
                {filteredMessages.length === 0 && searchQuery && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Search className="w-8 h-8 text-white/20 mb-3" />
                        <p className="text-white/40 text-sm">No messages matching &ldquo;{searchQuery}&rdquo;</p>
                    </div>
                )}

                {/* Messages */}
                {filteredMessages.map(msg => (
                    <div key={msg.id} className={cn('flex gap-3 max-w-3xl', msg.role === 'user' ? 'ml-auto flex-row-reverse' : '')}>
                        <div className={cn('flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
                            msg.role === 'user' ? 'bg-white/[0.08]' : msg.isCommand ? 'bg-emerald-500/10' : `bg-gradient-to-br ${agentConfig[msg.agent].gradient}`
                        )}>
                            {msg.role === 'user' ? <Terminal className="w-4 h-4 text-white/60" /> : msg.isCommand ? <Terminal className="w-4 h-4 text-emerald-400" /> : agentConfig[msg.agent].icon}
                        </div>

                        <div className={cn('rounded-2xl px-4 py-3 max-w-[80%]',
                            msg.role === 'user'
                                ? 'bg-orange-500/10 border border-orange-500/15 text-white/90'
                                : msg.isCommand
                                    ? 'bg-emerald-500/5 border border-emerald-500/10 text-white/80'
                                    : 'bg-white/[0.03] border border-white/[0.06] text-white/80'
                        )}>
                            <div className={cn('whitespace-pre-wrap leading-relaxed', fontSizeClass)}>
                                {msg.role === 'assistant' ? (
                                    <RenderMarkdown
                                        content={msg.content}
                                        onCodeCopy={() => toast.info('Copied', 'Code copied to clipboard')}
                                        onCodeExecute={code => executeCommand(code)}
                                    />
                                ) : (
                                    msg.content
                                )}
                                {/* Streaming cursor */}
                                {isStreaming && msg.id.startsWith('a-') && msg === filteredMessages[filteredMessages.length - 1] && msg.content && (
                                    <span className="inline-block w-2 h-4 bg-orange-400 animate-pulse ml-0.5 rounded-sm" />
                                )}
                            </div>

                            {/* Message Footer */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-[10px] text-white/25 font-mono">{relativeTime(msg.timestamp)}</span>
                                {/* Model Badge */}
                                {msg.model && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25 font-mono">
                                        {providerInfo[msg.provider as Provider]?.icon || '🤖'} {msg.model.split('-').slice(0, 2).join('-')}
                                    </span>
                                )}
                                {msg.role === 'assistant' && !isStreaming && (
                                    <>
                                        <button onClick={() => copyMessage(msg.id, msg.content)} className="text-white/20 hover:text-white/50 transition-colors" title="Copy">
                                            {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                        <button onClick={() => speakMessage(msg.content)} className="text-white/20 hover:text-white/50 transition-colors" title="Speak">
                                            <Volume2 className="w-3 h-3" />
                                        </button>
                                        {!msg.isCommand && (
                                            <Tooltip content="Create mission from this response">
                                                <button onClick={() => createMissionFromMessage(msg.content)} className="text-white/20 hover:text-violet-400 transition-colors">
                                                    <Target className="w-3 h-3" />
                                                </button>
                                            </Tooltip>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Loading indicator (non-streaming, e.g. slash commands) */}
                {isLoading && !isStreaming && (
                    <div className="flex gap-3 max-w-3xl">
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br', config.gradient)}>
                            {config.icon}
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                                <span className="text-xs text-white/30">Executing command...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* ═══ Slash Command Menu ═══ */}
            {showSlashMenu && (
                <div className="border-t border-white/[0.06] bg-black/40 backdrop-blur-sm px-4 py-2 max-h-36 overflow-y-auto shrink-0">
                    <div className="max-w-3xl mx-auto space-y-0.5">
                        {slashCommands
                            .filter(c => c.id.startsWith(slashFilter) || c.label.toLowerCase().includes(slashFilter) || c.desc.toLowerCase().includes(slashFilter))
                            .slice(0, 8)
                            .map(cmd => (
                                <button
                                    key={cmd.id}
                                    onClick={() => executeSlashCommand(cmd)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors text-left',
                                        cmd.danger ? 'hover:bg-red-500/5' : ''
                                    )}
                                >
                                    <span className={cn('flex-shrink-0', cmd.danger ? 'text-red-400/60' : 'text-white/30')}>{cmd.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <span className={cn('text-xs font-medium', cmd.danger ? 'text-red-400/80' : 'text-white/70')}>/{cmd.id}</span>
                                        <span className="text-[10px] text-white/30 ml-2">{cmd.desc}</span>
                                    </div>
                                </button>
                            ))}
                        {slashCommands.filter(c => c.id.startsWith(slashFilter) || c.label.toLowerCase().includes(slashFilter)).length === 0 && (
                            <div className="text-center py-2 text-xs text-white/25">No matching commands</div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ Input Bar ═══ */}
            <div className="border-t border-white/[0.06] bg-white/[0.01] backdrop-blur-sm px-4 py-3 shrink-0">
                {/* Quick Commands — collapsible */}
                {messages.length > 0 && !isStreaming && (
                    <div className="max-w-3xl mx-auto mb-2">
                        <button
                            onClick={() => setShowQuickCmds(!showQuickCmds)}
                            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/50 transition-colors mb-1"
                        >
                            {showQuickCmds ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            Quick Commands
                        </button>
                        {showQuickCmds && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                {quickCommands[agent].map(qc => (
                                    <button key={qc.label} onClick={() => sendMessage(qc.command)}
                                        className="text-left p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-orange-500/20 hover:bg-white/[0.05] transition-all text-[11px] text-white/50 hover:text-white/70 truncate">
                                        {qc.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-end gap-2 max-w-3xl mx-auto">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={`Message ${config.label}... (type / for commands)`}
                            rows={1}
                            maxLength={4000}
                            disabled={isStreaming}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-orange-500/30 focus:ring-1 focus:ring-orange-500/20 focus:shadow-[0_0_15px_rgba(255,107,53,0.1)] transition-all disabled:opacity-50"
                            style={{ minHeight: '44px', maxHeight: '150px' }}
                        />
                    </div>
                    {isStreaming ? (
                        <RocketButton variant="ghost" size="md" onClick={stopStreaming}
                            className="h-[44px] px-4 border border-red-500/20 text-red-400 hover:bg-red-500/10" icon={<Square className="w-4 h-4" />}>
                            <span className="hidden sm:inline">Stop</span>
                        </RocketButton>
                    ) : (
                        <RocketButton variant="primary" size="md" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}
                            className="h-[44px] px-4 shadow-[0_0_15px_rgba(255,107,53,0.2)]" icon={<Send className="w-4 h-4" />}>
                            <span className="hidden sm:inline">Send</span>
                        </RocketButton>
                    )}
                </div>
                <div className="flex items-center justify-center gap-3 mt-2">
                    <span className="text-[10px] text-white/15 font-mono">
                        {pi.icon} {pi.label} · {config.label} · /help for commands · Shift+Enter for newline
                    </span>
                    {input.length > 0 && (
                        <span className={cn('text-[10px] font-mono', input.length > 3500 ? 'text-red-400' : input.length > 2500 ? 'text-amber-400' : 'text-white/15')}>
                            {input.length}/4000
                        </span>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={confirmClear}
                title="Clear Chat"
                message={`Clear all ${messages.length} messages from ${config.label}? This removes saved history.`}
                danger confirmLabel="Clear All"
                onConfirm={clearChat}
                onCancel={() => setConfirmClear(false)}
            />
        </div>
    );
}
