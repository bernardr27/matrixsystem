'use client';

import React, { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Bell, Lock, Cpu, Database, Wifi, Settings as SettingsIcon, ChevronRight, Save, LogOut, RefreshCw, Terminal } from 'lucide-react';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import Link from 'next/link';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { useSoul } from '@/components/providers/SoulProvider';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050510]" />}>
            <SettingsPageContent />
        </Suspense>
    );
}

function SettingsPageContent() {
    const { services, coherence } = useTelemetry();
    const { profile } = useSoul();
    const [activeTab, setActiveTab] = useState('general');

    const [toggles, setToggles] = React.useState<Record<string, boolean>>({
        'system-visibility': true,
        'encrypted-handshakes': true,
        'critical-alerts': true,
        'deployment-pulse': false,
        'nexus-gate-auth': false
    });

    const handleToggle = (key: string) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const sections = [
        {
            id: 'general',
            label: 'General Protocol',
            icon: SettingsIcon,
        },
        {
            id: 'security',
            label: 'Security Layer',
            icon: Lock,
        },
        {
            id: 'config',
            label: 'Deep Config',
            icon: Terminal,
        }
    ];

    const configCode = `{
    "system": {
        "id": "MATRIX-HUB-7",
    "resonance_threshold": 0.85,
    "neural_binding": "strict"
  },
  "modules": [
    "ghost-runner", 
    "sentinel", 
    "sage-link"
  ],
  "overrides": {
    "force_sync": false,
    "debug_mode": true
  }
}`;

    return (
        <div className="min-h-full bg-[#050510] text-slate-200 selection:bg-cyan-500/30 pb-8 overflow-x-hidden relative">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 space-y-8 relative z-10">
                {/* Header */}
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <SettingsIcon size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
                            <p className="text-[11px] text-white/40 mt-0.5">System configuration &amp; governance</p>
                        </div>
                    </div>
                    <Link href="/">
                        <NeuralButton variant="ghost" className="rounded-xl w-9 h-9 p-0 flex items-center justify-center">
                            <X size={18} />
                        </NeuralButton>
                    </Link>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Sidebar Nav */}
                    <div className="xl:col-span-3 space-y-4">
                        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 mb-8">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                        <Shield size={20} className="text-white" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-black uppercase italic text-white">{profile?.username || 'User'}</div>
                                    <div className="text-[9px] font-mono text-cyan-500">Level 4 // Admin</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-white/5 pt-3">
                                <span>SIGNAL: <span className="text-emerald-400">STRONG</span></span>
                                <span>COH: <span className="text-violet-400">{coherence}%</span></span>
                            </div>
                        </div>

                        {sections.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setActiveTab(s.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300",
                                    activeTab === s.id
                                        ? "bg-cyan-500/10 border-cyan-500/30 text-white shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                                        : "bg-transparent border-transparent hover:bg-white/5 text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <s.icon size={20} className={activeTab === s.id ? "text-cyan-400" : "text-current"} />
                                <span className="text-xs font-black uppercase tracking-widest italic">{s.label}</span>
                                {activeTab === s.id && <ChevronRight size={16} className="ml-auto text-cyan-500" />}
                            </button>
                        ))}
                    </div>

                    {/* Content Panel */}
                    <div className="xl:col-span-9">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'config' ? (
                                    <NeuralSurface className="p-8 min-h-[500px] relative overflow-hidden flex flex-col">
                                        <div className="absolute top-0 right-0 p-8 opacity-20">
                                            <Terminal size={120} />
                                        </div>
                                        <h2 className="text-2xl font-black uppercase italic text-white mb-6">Neural_Configuration_JSON</h2>

                                        <div className="flex-1 bg-black/50 rounded-2xl border border-white/10 p-6 font-mono text-sm overflow-hidden relative group">
                                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-white/5 border-r border-white/5 flex flex-col items-center pt-6 text-[10px] text-slate-600 gap-1 select-none">
                                                {Array.from({ length: 15 }).map((_, i) => <div key={i}>{i + 1}</div>)}
                                            </div>
                                            <textarea
                                                className="w-full h-full bg-transparent border-none text-emerald-400 pl-8 focus:outline-none resize-none font-mono"
                                                defaultValue={configCode}
                                                spellCheck={false}
                                            />
                                        </div>

                                        <div className="mt-6 flex justify-end gap-4">
                                            <NeuralButton variant="ghost">Reset Defaults</NeuralButton>
                                            <NeuralButton icon="spark" glow>Compile & Push</NeuralButton>
                                        </div>
                                    </NeuralSurface>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <NeuralSurface className="p-6 flex items-center justify-between gap-4 group cursor-pointer" onClick={() => handleToggle('system-visibility')}>
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-wide text-white group-hover:text-cyan-400 transition-colors">System Visibility</h3>
                                                <p className="text-[10px] text-slate-500 mt-1">Broadcast presence to local mesh nodes.</p>
                                            </div>
                                            <div className={cn("w-12 h-6 rounded-full border transition-all relative", toggles['system-visibility'] ? "bg-cyan-500/20 border-cyan-500/50" : "bg-white/5 border-white/10")}>
                                                <div className={cn("absolute top-1 left-1 w-3.5 h-3.5 rounded-full transition-all", toggles['system-visibility'] ? "bg-cyan-400 translate-x-6 shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "bg-slate-600")} />
                                            </div>
                                        </NeuralSurface>
                                        <NeuralSurface className="p-6 flex items-center justify-between gap-4 group cursor-pointer" onClick={() => handleToggle('encrypted-handshakes')}>
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-wide text-white group-hover:text-cyan-400 transition-colors">Encrypted Handshakes</h3>
                                                <p className="text-[10px] text-slate-500 mt-1">Force AES-256 on all Ghost channels.</p>
                                            </div>
                                            <div className={cn("w-12 h-6 rounded-full border transition-all relative", toggles['encrypted-handshakes'] ? "bg-cyan-500/20 border-cyan-500/50" : "bg-white/5 border-white/10")}>
                                                <div className={cn("absolute top-1 left-1 w-3.5 h-3.5 rounded-full transition-all", toggles['encrypted-handshakes'] ? "bg-cyan-400 translate-x-6 shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "bg-slate-600")} />
                                            </div>
                                        </NeuralSurface>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
