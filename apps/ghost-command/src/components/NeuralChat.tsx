'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSage } from '@/context/SageContext';
import {
    MessageSquare, Terminal, User, Sparkles,
    ArrowRight, Command, Hash, Zap, Cpu, Shield,
    PenTool, Eye, Activity, Box, Code, Layers, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { StreamingIndicator } from '@/components/ui/DesignTokens';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* AG-UI + OpenAI SDK: Syntax-highlighted code blocks with lazy-loaded Prism */
function SyntaxCodeBlock({ code, language }: { code: string; language: string }) {
    const [SH, setSH] = React.useState<any>(null);
    const [style, setStyle] = React.useState<any>(null);
    const [copied, setCopied] = React.useState(false);

    React.useEffect(() => {
        Promise.all([
            import('react-syntax-highlighter').then(m => m.Prism || m.default),
            import('react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus').then(m => m.default),
        ]).then(([sh, s]) => { setSH(() => sh); setStyle(s); });
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-6 rounded-3xl overflow-hidden border border-white/5 bg-black/60 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-b border-white/5">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/30" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/30" />
                    <div className="w-3 h-3 rounded-full bg-green-500/30" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 px-3">{language}</span>
                <button type="button" onClick={handleCopy} className="text-[9px] font-bold text-white/20 hover:text-white/50 transition-colors uppercase tracking-wider flex items-center gap-1.5">
                    {copied ? <><Check size={10} className="text-emerald-400" /> Copied</> : <><Copy size={10} /> Copy</>}
                </button>
            </div>
            {SH && style ? (
                <div className="overflow-x-auto custom-scrollbar">
                    <SH language={language} style={style} customStyle={{ background: 'transparent', margin: 0, padding: '1.5rem', fontSize: '13px', lineHeight: '1.6' }} showLineNumbers lineNumberStyle={{ color: 'rgba(255,255,255,0.08)', minWidth: '2em' }}>
                        {code}
                    </SH>
                </div>
            ) : (
                <div className="p-6 overflow-x-auto text-[13px] font-mono text-cyan-100/80 custom-scrollbar leading-relaxed">
                    <code>{code}</code>
                </div>
            )}
        </div>
    );
}

const RALPH_COMMANDS = [
    { label: 'System Scan', cmd: 'scan', icon: Activity },
    { label: 'Visual Audit', cmd: 'visual_scan', icon: Eye },
    { label: 'File Index', cmd: 'ls', icon: Box },
    { label: 'Network Probe', cmd: 'scan_network', icon: Activity },
];

const SAGE_COMMANDS = [
    { label: 'Status Report', cmd: 'status', icon: Shield },
    { label: 'Blueprint', cmd: 'sage:blueprint', icon: PenTool },
    { label: 'Triage', cmd: 'triage:boot_health', icon: Activity },
    { label: 'Memory', cmd: 'sage:memory_vault', icon: Cpu },
];

export function NeuralChat() {
    const { messages, status, sendCommand, sageExecuting, ralphExecuting } = useSage();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';
    const scrollRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'sage' | 'ralph'>('sage');
    const [showLogs, setShowLogs] = useState(false);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const [sendPulse, setSendPulse] = useState(false);

    // Filter Chat Messages
    const chatMessages = messages.filter(m => {
        // @ts-ignore
        if (m.isTechnical) return false;

        const isRalphMsg = m.agent === 'ralph' || (
            !m.agent && (
                (m.content || '').toLowerCase().includes('ralph:') ||
                (m.content || '').includes('🤖 RALPH') ||
                (m.content || '').startsWith('RALPH:') ||
                (m.content || '').toLowerCase().includes('visual audit')
            )
        );

        if (mode === 'ralph') return isRalphMsg;
        return !isRalphMsg;
    });

    // Filter Logs (Technical)
    const logMessages = messages.filter(m => {
        // @ts-ignore
        return m.isTechnical;
    });
    const reversedLogs = [...logMessages].reverse().slice(0, 50);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current && !isUserScrolling) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages, status, isUserScrolling, sageExecuting, ralphExecuting]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        setIsUserScrolling(!isAtBottom);
    };

    const handleSend = () => {
        if (!input.trim()) return;
        const cmd = mode === 'ralph' ? `ralph:${input}` : input;
        sendCommand(cmd);
        setInput('');
        setIsUserScrolling(false);
        setSendPulse(true);
        setTimeout(() => setSendPulse(false), 600);
    };

    const currentSuggestions = mode === 'ralph' ? RALPH_COMMANDS : SAGE_COMMANDS;
    const isThinking = status === 'thinking' || sageExecuting || ralphExecuting;

    return (
        <div className="flex flex-row h-full w-full relative overflow-hidden bg-[#0a0f1a]">
            {/* LOG SIDEBAR (Desktop) */}
            <div className="hidden 2xl:flex w-80 flex-col border-r border-slate-700/20 bg-[#070b14] shrink-0">
                <div className="px-5 py-4 border-b border-slate-700/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Activity size={14} className="text-indigo-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] font-semibold text-slate-200 leading-none">Activity Log</span>
                            <span className="text-[10px] text-slate-500 mt-0.5">{hasSupabase ? 'Live stream' : 'Offline'}</span>
                        </div>
                    </div>
                    <Layers size={14} className="text-slate-600" />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {reversedLogs.map((log, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={log.id || i}
                            className="group p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/20 hover:border-slate-600/30 transition-all hover:bg-slate-800/40"
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className={cn(
                                    "text-[9px] font-semibold px-2 py-0.5 rounded-md",
                                    log.status === 'failed'
                                        ? "bg-red-500/10 text-red-400"
                                        : "bg-emerald-500/10 text-emerald-400"
                                )}>
                                    {log.status === 'failed' ? 'Error' : 'Event'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-600">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}
                                </span>
                            </div>
                            <div className="text-[11px] text-slate-400 group-hover:text-slate-200 line-clamp-2 transition-colors break-all leading-relaxed">
                                {log.content}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0a0f1a] relative h-full">
                {/* MODE SWITCHER */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="flex p-1 bg-slate-800/60 backdrop-blur-xl rounded-full border border-slate-700/30 shadow-lg">
                        <button type="button"
                            onClick={() => { setMode('sage'); setIsUserScrolling(false); }}
                            className={cn(
                                "px-5 py-2 rounded-full text-[12px] font-semibold transition-all duration-300",
                                mode === 'sage'
                                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            Sage
                        </button>
                        <button type="button"
                            onClick={() => { setMode('ralph'); setIsUserScrolling(false); }}
                            className={cn(
                                "px-5 py-2 rounded-full text-[12px] font-semibold transition-all duration-300",
                                mode === 'ralph'
                                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            Ralph
                        </button>
                    </div>
                </div>

                {/* CHAT STREAM */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 custom-scrollbar scroll-smooth [&::-webkit-scrollbar]:hidden pt-16"
                >
                    {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center select-none pb-20">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/10 flex items-center justify-center mb-6">
                                <Command size={28} className="text-blue-400/60" />
                            </div>
                            <span className="text-[14px] font-medium text-slate-500">
                                Start a conversation with {mode === 'ralph' ? 'Ralph' : 'Sage'}
                            </span>
                            <span className="text-[12px] text-slate-600 mt-1">
                                Type a message or pick a suggestion below
                            </span>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {chatMessages.map((msg, idx) => {
                            const isUser = msg.role === 'user';
                            const isFailed = msg.status === 'failed' || msg.content.includes('COMMAND_FAILURE');

                            return (
                                <motion.div
                                    key={msg.id || `${idx}-${msg.timestamp}`}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-6 max-w-5xl mx-auto w-full group",
                                        isUser ? "flex-row-reverse" : ""
                                    )}
                                >
                                    {/* AVATAR */}
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border relative z-10 transition-transform group-hover:scale-105 duration-300",
                                        isUser
                                            ? "bg-slate-700/30 border-slate-600/20 text-slate-400"
                                            : isFailed
                                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                                : mode === 'ralph'
                                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    )}>
                                        {isUser ? <User size={18} /> : (isFailed ? <Zap size={18} /> : (mode === 'ralph' ? <Sparkles size={18} /> : <Terminal size={18} />))}

                                        {!isUser && !isFailed && (
                                            <div className={cn(
                                                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0f1a]",
                                                mode === 'ralph' ? "bg-amber-500" : "bg-blue-500"
                                            )} />
                                        )}
                                    </div>

                                    {/* MESSAGE CONTENT */}
                                    <div className={cn(
                                        "flex flex-col gap-3 min-w-0 max-w-[85%]",
                                        isUser ? "items-end" : "items-start"
                                    )}>
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="text-[12px] font-semibold text-slate-400">
                                                {isUser ? 'You' : (mode === 'ralph' ? 'Ralph' : 'Sage')}
                                            </span>
                                            <span className="text-[11px] text-slate-600">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className={cn(
                                            "px-5 py-4 rounded-2xl text-[14px] leading-relaxed border transition-all duration-300",
                                            isUser
                                                ? "bg-blue-500/10 border-blue-500/15 text-slate-200 rounded-tr-md"
                                                : isFailed
                                                    ? "bg-red-500/5 border-red-500/15 text-red-200"
                                                    : "bg-slate-800/40 border-slate-700/20 text-slate-300 rounded-tl-md group-hover:bg-slate-800/50 group-hover:border-slate-600/25"
                                        )}>
                                            {isUser ? (
                                                <div className="whitespace-pre-wrap font-mono text-[14px] tracking-tight">{msg.content}</div>
                                            ) : (
                                                <div className="markdown-content font-sans">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            code({ node, inline, className, children, ...props }: any) {
                                                                const codeString = String(children).replace(/\n$/, '');
                                                                const langMatch = /language-(\w+)/.exec(className || '');
                                                                const lang = langMatch ? langMatch[1] : 'text';

                                                                return !inline ? (
                                                                    <SyntaxCodeBlock code={codeString} language={lang} />
                                                                ) : (
                                                                    <code className="bg-blue-500/10 px-1.5 py-0.5 rounded-md text-[13px] font-mono text-blue-400 border border-blue-500/15" {...props}>
                                                                        {children}
                                                                    </code>
                                                                )
                                                            },
                                                            table({ children }) {
                                                                return <div className="overflow-x-auto my-4 rounded-xl border border-slate-700/20 bg-slate-800/30"><table className="w-full text-left text-[13px]">{children}</table></div>
                                                            },
                                                            thead({ children }) {
                                                                return <thead className="bg-slate-700/20 text-slate-300 text-[12px] font-semibold">{children}</thead>
                                                            },
                                                            th({ children }) {
                                                                return <th className="px-4 py-3 border-b border-slate-700/20">{children}</th>
                                                            },
                                                            td({ children }) {
                                                                return <td className="px-4 py-3 border-b border-slate-700/10 text-slate-400">{children}</td>
                                                            },
                                                            a({ children, href }) {
                                                                return <a href={href} className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 transition-colors font-medium">{children}</a>
                                                            },
                                                            ul({ children }) {
                                                                return <ul className="list-none my-4 space-y-3 text-slate-300">{children}</ul>
                                                            },
                                                            li({ children }) {
                                                                return <li className="flex items-start gap-2.5 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-blue-500/40 before:mt-2">{children}</li>
                                                            },
                                                            blockquote({ children }) {
                                                                return <blockquote className="border-l-[3px] border-blue-500/30 pl-5 py-2 italic text-slate-400 my-4 bg-blue-500/5 rounded-r-xl">{children}</blockquote>
                                                            }
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {isThinking && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-6 max-w-5xl mx-auto w-full"
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                                mode === 'ralph' ? "bg-amber-500/10 border-amber-500/20" : "bg-blue-500/10 border-blue-500/20"
                            )}>
                                <Activity size={18} className="animate-spin text-current opacity-60" />
                            </div>
                            <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-slate-800/40 border border-slate-700/20">
                                <StreamingIndicator state={sageExecuting || ralphExecuting ? 'thinking' : 'streaming'} label="Processing..." />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* INPUT AREA (UI8 Floating style) */}
                <div className="px-4 sm:px-6 pt-3 pb-4 relative shrink-0">
                    <div className="max-w-5xl mx-auto space-y-3">
                        {/* Quick Actions */}
                        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 justify-center flex-wrap">
                            {currentSuggestions.map(s => (
                                <button type="button"
                                    key={s.cmd}
                                    onClick={() => {
                                        sendCommand(mode === 'ralph' ? `ralph:${s.cmd}` : s.cmd);
                                        setSendPulse(true);
                                        setTimeout(() => setSendPulse(false), 600);
                                    }}
                                    disabled={isThinking}
                                    className={cn(
                                        "flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/40 border border-slate-700/20 active:scale-95 transition-all shrink-0 group hover:border-blue-500/30 hover:bg-slate-800/60",
                                        isThinking ? "opacity-20 cursor-not-allowed" : ""
                                    )}
                                >
                                    <s.icon size={13} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-200">{s.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Input Box */}
                        <div className="relative group w-full">
                            <AnimatePresence>
                                {sendPulse && (
                                    <motion.div
                                        initial={{ opacity: 1, scale: 0.98 }}
                                        animate={{ opacity: 0, scale: 1.05 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.8 }}
                                        className={cn(
                                            "absolute inset-0 rounded-2xl pointer-events-none z-10 border-2",
                                            mode === 'ralph' ? "border-amber-500/30 shadow-lg shadow-amber-500/10" : "border-blue-500/30 shadow-lg shadow-blue-500/10"
                                        )}
                                    />
                                )}
                            </AnimatePresence>

                            <div className="relative bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/30 p-1.5 shadow-lg transition-all group-focus-within:border-blue-500/20 group-focus-within:shadow-xl">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={isThinking ? "System Processing..." : `Message ${mode === 'ralph' ? 'Construct' : 'Architect'}...`}
                                    disabled={isThinking}
                                    className={cn(
                                        "w-full bg-transparent px-6 py-3.5 text-[14px] text-slate-200 placeholder:text-slate-600 transition-all outline-none",
                                        isThinking ? "opacity-30 cursor-not-allowed" : ""
                                    )}
                                />
                                <button type="button"
                                    onClick={handleSend}
                                    disabled={!input.trim() || isThinking}
                                    className={cn(
                                        "absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                        !input.trim() || isThinking
                                            ? "bg-slate-700/30 text-slate-600"
                                            : mode === 'ralph'
                                                ? "bg-amber-500 text-white hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/20"
                                                : "bg-blue-500 text-white hover:bg-blue-400 active:scale-95 shadow-md shadow-blue-500/20"
                                    )}
                                >
                                    <ArrowRight size={20} className={cn("transition-transform duration-500", !input.trim() ? "" : "translate-x-0.5")} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
