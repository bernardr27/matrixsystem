'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Brain, Cpu, MessageSquare, Terminal as TerminalIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

import { NeuralSurface } from '@/components/ui/NeuralSurface';

export default function NeuralTerminal() {
    const [prompt, setPrompt] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const activeChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleSend = async () => {
        if (!prompt.trim() || isThinking) return;

        const userPrompt = prompt;
        setPrompt('');
        setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
        setIsThinking(true);

        // Dispatch as a "chat" mission to the Proxy
        const { error } = await supabase.from('matrix_missions').insert({
            title: `Neural_Inquiry: ${userPrompt.substring(0, 30)}...`,
            description: 'Natural language request for local AI.',
            priority: 'normal',
            payload: { type: 'chat', prompt: userPrompt },
            status: 'queued'
        });

        if (error) {
            setMessages(prev => [...prev, { role: 'ai', content: 'ERROR: Neural Bridge disconnected.' }]);
            setIsThinking(false);
            return;
        }

        // Clean up any previous channel before creating a new one
        if (activeChannel.current) {
            try { supabase.removeChannel(activeChannel.current); } catch {}
            activeChannel.current = null;
        }

        // Real-time subscription for the mission result
        const channel = supabase
            .channel(`mission_response_${Date.now()}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'matrix_missions' },
                (payload: any) => {
                    const mission = payload.new;
                    if (mission.title.includes(userPrompt.substring(0, 20)) && mission.status === 'completed') {
                        const logs = mission.logs || [];
                        const aiLog = logs.find((l: any) => l.type === 'success' && l.message.startsWith('Neural Response:'));
                        if (aiLog) {
                            const response = aiLog.message.replace('Neural Response: ', '');
                            setMessages(prev => [...prev, { role: 'ai', content: response }]);
                            setIsThinking(false);
                            try { supabase.removeChannel(channel); } catch {}
                            activeChannel.current = null;
                        }
                    } else if (mission.status === 'failed') {
                        setMessages(prev => [...prev, { role: 'ai', content: 'Mission failed. Local brain might be overloaded.' }]);
                        setIsThinking(false);
                        try { supabase.removeChannel(channel); } catch {}
                        activeChannel.current = null;
                    }
                }
            )
            .subscribe();

        activeChannel.current = channel;

        // Timeout: if no response in 15s, abort gracefully
        setTimeout(() => {
            if (activeChannel.current === channel) {
                setIsThinking(prev => {
                    if (prev) {
                        setMessages(m => [...m, { role: 'ai', content: 'Neural bridge timeout. The local brain may be offline.' }]);
                    }
                    return false;
                });
                try { supabase.removeChannel(channel); } catch {}
                activeChannel.current = null;
            }
        }, 15000);
    };

    return (
        <NeuralSurface variant="glass" className="flex flex-col h-full gap-4 min-h-[400px]" style={{ padding: '1rem' }}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Brain size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-white/90">Neural_Bridge</h2>
                        <span className="text-[8px] font-mono text-purple-400/60 uppercase tracking-widest">Local_Ollama_v1.0</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col relative">
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                >
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4 px-8">
                            <Sparkles size={40} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                                Autonomous Proxy Ready.<br />Talk to me remotely.
                            </p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed",
                                m.role === 'user'
                                    ? "bg-white/5 border border-white/10 self-end text-white/80"
                                    : "bg-purple-500/10 border border-purple-500/20 self-start text-white/90 shadow-[0_0_20px_rgba(168,85,247,0.05)]"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-1.5 opacity-30 text-[8px] font-black uppercase tracking-widest">
                                {m.role === 'user' ? <MessageSquare size={10} /> : <Cpu size={10} />}
                                {m.role === 'user' ? 'Commander' : 'Aether'}
                            </div>
                            {m.content}
                        </motion.div>
                    ))}
                    {isThinking && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-purple-500/5 border border-purple-500/10 self-start p-3 rounded-2xl flex items-center gap-3"
                        >
                            <div className="flex gap-1">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-purple-400/60 animate-pulse">Thinking...</span>
                        </motion.div>
                    )}
                </div>

                <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2">
                    <input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Neural prompt..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-white focus:border-purple-500/50 outline-none transition-all placeholder:text-white/10"
                    />
                    <button type="button"
                        onClick={handleSend}
                        disabled={!prompt.trim() || isThinking}
                        className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 hover:bg-purple-500/30 active:scale-95 transition-all disabled:opacity-20"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 opacity-10 px-2 justify-center">
                <TerminalIcon size={12} />
                <span className="text-[7px] font-mono uppercase tracking-[0.3em]">Encrypted_Neural_Pathway</span>
            </div>
        </NeuralSurface>
    );
}
