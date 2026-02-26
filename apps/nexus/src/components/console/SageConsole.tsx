'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Terminal, Zap, Shield, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { uuidv4 } from '@/lib/uuid';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import { useTelemetry } from '@/components/providers/TelemetryProvider';

interface LogEntry {
    id: string;
    text: string;
    type: 'user' | 'sage' | 'sys' | 'err';
    timestamp: string;
}

export function SageConsole() {
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([
        { id: '1', text: 'SAGE ORBITAL UPLINK ESTABLISHED', type: 'sys', timestamp: '00:00:00' },
        { id: '2', text: 'AWAITING NEURAL COMMANDS...', type: 'sys', timestamp: '00:00:00' },
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const addLog = (text: string, type: LogEntry['type'] = 'sys') => {
        const timestamp = new Date(Date.now()).toLocaleTimeString([], { hour12: false });
        setLogs(prev => [...prev.slice(-40), { id: uuidv4(), text, type, timestamp }]);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const { services, coherence } = useTelemetry();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // ... existing logs state ...

    // Waveform Visualizer
    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let phase = 0;

        const render = () => {
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);

            if (isStreaming || isSpeaking) {
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = isSpeaking ? '#fbbf24' : '#22d3ee'; // Amber for speech, Cyan for thinking

                for (let x = 0; x < width; x++) {
                    // diverse frequencies for "voice" look
                    const amplitude = isSpeaking ? 15 : 10;
                    const frequency = isSpeaking ? 0.2 : 0.1;
                    const y = centerY + Math.sin(x * frequency + phase) * amplitude * Math.sin(x / width * Math.PI);
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                phase += 0.2;
                animationFrameId = requestAnimationFrame(render);
            } else {
                // Flatline (Idle) — draw once, no loop
                ctx.beginPath();
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.moveTo(0, centerY);
                ctx.lineTo(width, centerY);
                ctx.stroke();
            }
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isStreaming, isSpeaking]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isStreaming) return;

        const cmd = input.trim();
        setInput('');
        addLog(cmd, 'user');
        setIsStreaming(true);

        const isSystemCmd = cmd.startsWith('/');

        if (isSystemCmd) {
            // ... existing system command logic ...
            const cmdId = uuidv4();
            const finalCmd = cmd.startsWith('/query ')
                ? `sage:query ${cmd.replace('/query ', '').trim()}`
                : `sage:${cmd.replace('/', '')}`;

            try {
                const { error } = await supabase
                    .from('ghost_bridge')
                    .insert([{
                        id: cmdId,
                        command: finalCmd,
                        source: 'nexus_console',
                        status: 'pending'
                    }]);

                if (error) throw error;

                let responseReceived = false;
                const channel = supabase.channel(`sage_${cmdId}`)
                    .on('postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'ghost_bridge', filter: `id=eq.${cmdId}` },
                        (payload) => {
                            const { status, output } = payload.new;
                            if (status === 'executed') {
                                addLog(output || 'Command executed.', 'sage');
                                responseReceived = true;
                                setIsStreaming(false);
                                supabase.removeChannel(channel);
                            } else if (status === 'failed') {
                                addLog(output || 'Command failed.', 'err');
                                responseReceived = true;
                                setIsStreaming(false);
                                supabase.removeChannel(channel);
                            }
                        }
                    ).subscribe();

                setTimeout(() => {
                    if (!responseReceived) {
                        setIsStreaming(false);
                        supabase.removeChannel(channel);
                    }
                }, 30000);
            } catch (err) {
                addLog(`DISPATCH ERROR: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
                setIsStreaming(false);
            }
        } else {
            try {
                // INJECT TELEMETRY CONTEXT
                const systemContext = `
[SYSTEM TELEMETRY]
Services: ${JSON.stringify(services)}
Coherence: ${coherence}%
                `.trim();

                const chatHistory = logs
                    .filter(l => l.type === 'user' || l.type === 'sage')
                    .slice(-10)
                    .map(l => ({
                        role: l.type === 'user' ? 'user' as const : 'assistant' as const,
                        content: l.text
                    }));

                // Prepend context to the latest message or as a system message if supported
                // For now, we append it to the last user message for context
                const lastMsg = chatHistory.pop();
                if (lastMsg) {
                    chatHistory.push({ role: 'user', content: `${systemContext}\n\n${lastMsg.content}` });
                } else {
                    chatHistory.push({ role: 'user', content: `${systemContext}\n\n${cmd}` });
                }

                const res = await fetch('/api/sage-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: chatHistory })
                });

                const data = await res.json();
                addLog(data.content || 'No response from Sage.', 'sage');

                if (voiceEnabled && data.content) {
                    const cleanOutput = data.content.substring(0, 500);
                    setIsSpeaking(true);
                    supabase.from('ghost_bridge').insert([{
                        command: `sage:speak ${cleanOutput}`,
                        source: 'nexus_voice',
                        status: 'pending'
                    }]).then(() => {
                        setTimeout(() => setIsSpeaking(false), 3000);
                    });
                }
            } catch (err) {
                addLog(`NEURAL UPLINK FAILURE: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
            }
            setIsStreaming(false);
        }
    };

    return (
        <NeuralSurface variant="neumorphic" className="h-full flex flex-col overflow-hidden border-none p-0 bg-black/40">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Brain size={18} className="text-cyan-400" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-50" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white font-display leading-none">
                            Sage Console
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[7px] font-bold uppercase tracking-widest text-cyan-400/80 leading-none">
                                Neural Orchestration Uplink
                            </span>
                            {/* Visualizer Canvas */}
                            <canvas ref={canvasRef} width={60} height={20} className="opacity-50" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={cn(
                            "p-1.5 rounded-lg transition-all border",
                            voiceEnabled
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                : "bg-white/5 border-white/10 text-slate-500 hover:text-white"
                        )}
                        title={voiceEnabled ? "Voice enabled" : "Voice disabled"}
                    >
                        {isSpeaking ? (
                            <Volume2 size={12} className="animate-pulse" />
                        ) : voiceEnabled ? (
                            <Volume2 size={12} />
                        ) : (
                            <VolumeX size={12} />
                        )}
                    </button>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[7px] font-black uppercase tracking-widest text-cyan-400">
                        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
                        Live
                    </div>
                </div>
            </div>

            {/* Logs Area */}
            <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-[10px] leading-relaxed custom-scrollbar bg-black/20"
            >
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <ConsoleMessage key={log.id} log={log} />
                    ))}
                </AnimatePresence>
                {isStreaming && (
                    <div className="flex gap-4 text-cyan-400/50 italic animate-pulse">
                        <span className="text-[9px] opacity-20 select-none shrink-0 w-16">[SYNC]</span>
                        <span>Sage is processing...</span>
                    </div>
                )}
            </div>

            {/* Input Area (Veylix Style Floating Pill) */}
            <div className="p-6">
                <form onSubmit={handleSend}>
                    <div className="relative group">
                        {/* THE COMMAND PILL */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000" />

                        <div className="relative flex items-center gap-4 px-6 py-4 bg-black/60 backdrop-blur-3xl rounded-2xl border border-white/10 group-focus-within:border-cyan-500/50 transition-all shadow-[var(--m-shadow-neumorphic-inner)]">
                            <div className="p-2 rounded-xl bg-white/5 flex items-center justify-center">
                                <Terminal size={14} className="text-cyan-400" />
                            </div>

                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="ISSUE NEURAL COMMAND..."
                                className="flex-1 bg-transparent border-none outline-none text-[10px] font-black tracking-[0.2em] text-white placeholder:text-slate-600 uppercase disabled:opacity-50"
                                disabled={isStreaming}
                            />

                            <NeuralButton
                                type="submit"
                                disabled={!input.trim() || isStreaming}
                                variant="neon"
                                size="sm"
                                isLoading={isStreaming}
                                className="h-10 px-6"
                            >
                                <Send size={14} />
                            </NeuralButton>
                        </div>
                    </div>
                </form>
            </div>
        </NeuralSurface>
    );
}

function ConsoleMessage({ log }: { log: LogEntry }) {
    const [expanded, setExpanded] = useState(false);
    const isLong = log.text.length > 180;
    const displayText = expanded || !isLong ? log.text : log.text.slice(0, 180) + '...';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex flex-col gap-2 relative",
                log.type === 'user' ? "items-end ml-12" : "items-start mr-12"
            )}
        >
            {/* Meta Header */}
            <div className="flex items-center gap-2 px-1">
                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20">
                    {log.type === 'user' ? 'UPLINK_SOURCE' : 'SAGE_RESONANCE'}
                </span>
                <span className="text-[7px] font-mono text-white/10">[{log.timestamp}]</span>
            </div>

            {/* Message Bubble (Nova/Veylix Style) */}
            <NeuralSurface
                variant={log.type === 'sage' ? 'neon' : 'neumorphic'}
                className={cn(
                    "p-4 py-3 !rounded-2xl border-white/5 transition-all duration-500",
                    log.type === 'err' ? "border-red-500/20 bg-red-500/5" : "",
                    log.type === 'user' ? "bg-white/[0.03]" : "bg-cyan-500/[0.02]"
                )}
                style={log.type === 'sage' ? { boxShadow: 'var(--m-glow-cyan)' } : {}}
            >
                <div className="flex items-start gap-3">
                    {log.type === 'sage' && <Sparkles size={12} className="text-cyan-400 mt-0.5 shrink-0" />}
                    <div className={cn(
                        "text-[10px] leading-relaxed break-words",
                        log.type === 'user' ? "font-bold text-slate-200" : "font-light text-cyan-50 text-opacity-80",
                        log.type === 'err' ? "text-red-400 font-mono" : ""
                    )}>
                        {displayText}
                    </div>
                </div>

                {isLong && (
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-cyan-400 transition-colors"
                    >
                        {expanded ? '[Collapse]' : '[Show_Full_Relay]'}
                    </button>
                )}
            </NeuralSurface>
        </motion.div>
    );
}
