'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, ChevronRight, Globe, Power, QrCode, Terminal, Shield, Cpu, Activity, Zap, Box, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
    const sections = [
        {
            title: "Universal Telemetry",
            icon: Globe,
            content: "Matrix Hub maintains a real-time neural link with your infrastructure. The header status indicator ('Global Node Active') shows the health of the Matrix Hub Sentinel on your home machine.",
            details: [
                "Real-time Port Monitoring (3000, 5173)",
                "Sub-1s state synchronization",
                "Cross-continent terminal reflection"
            ],
            color: "text-cyan-400"
        },
        {
            title: "Remote Ignition (Cold Boot)",
            icon: Power,
            content: "The 'DEEP IGNITION' panel broadcasts a high-priority packet to the local Sentinel. Use this if your PC is on but services are inactive.",
            details: [
                "Individual service ignition (Reflect, Ghost)",
                "Global system-wide reboot",
                "Automated fail-safe recovery"
            ],
            color: "text-red-400"
        },
        {
            title: "Matrix Gate (UI Tunnels)",
            icon: QrCode,
            content: "Establish temporary, encrypted tunnels to your local dashboards. Mobile devices can scan the QR code for instant, secure handover.",
            details: [
                "Encrypted local-to-web bridging",
                "Haptic-ready mobile interfaces",
                "Instant deactivation for security"
            ],
            color: "text-violet-400"
        },
        {
            title: "Neural Command Syntax",
            icon: Terminal,
            content: "The Command Console accepts advanced system protocols for direct hardware/software manipulation.",
            details: [
                "sys:sync - Force-rebase system state",
                "sys:restart_all - Sequential process bounce",
                "clip:<text> - Remote clipboard synchronization"
            ],
            color: "text-slate-400"
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-3xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30, rotateX: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30, rotateX: 5 }}
                        className="relative w-full max-w-5xl cockpit-surface overflow-hidden perspective-2000"
                    >
                        <div className="flex h-[80vh] flex-col lg:flex-row">
                            {/* Sidebar Visual */}
                            <div className="hidden lg:flex w-72 bg-white/[0.03] border-r border-white/5 p-10 flex-col items-center justify-between">
                                <div className="space-y-8 text-center pt-8">
                                    <div className="w-40 h-40 relative mx-auto">
                                        <div className="absolute inset-0 border border-cyan-400/20 rounded-full animate-ping" />
                                        <div className="absolute inset-4 border border-cyan-400/10 rounded-full animate-pulse" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Compass size={60} className="text-cyan-400/40" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic mb-2">Neural_Architect</h4>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.6em] italic opacity-60">System_V0.4.5</p>
                                    </div>
                                </div>
                                <div className="space-y-4 text-center">
                                    <div className="text-[9px] text-cyan-400/40 font-black tracking-[0.4em] uppercase italic">System_Resonance</div>
                                    <div className="flex gap-2 justify-center">
                                        <div className="w-1.5 h-4 bg-cyan-400/20 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-6 bg-cyan-400/20 rounded-full animate-bounce [animation-delay:200ms]" />
                                        <div className="w-1.5 h-3 bg-cyan-400/20 rounded-full animate-bounce [animation-delay:400ms]" />
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-10 space-y-12 overflow-y-auto custom-scrollbar relative z-10 bg-black/20">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                                <Box className="text-cyan-400" size={18} />
                                            </div>
                                            <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] italic">System_Operational_Manual</h4>
                                        </div>
                                        <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none text-white overflow-visible py-1">Neural Command Guide</h2>
                                    </div>
                                    <button type="button"
                                        onClick={onClose}
                                        className="p-4 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl transition-all text-slate-500 hover:text-white border border-white/5 active:scale-90"
                                    >
                                        <X size={28} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {sections.map((section, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="group module-card p-8 hover:bg-white/[0.04] relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                                                <section.icon size={80} />
                                            </div>
                                            <div className="flex items-center gap-5 mb-6">
                                                <div className={cn(
                                                    "p-4 rounded-2xl bg-black/40 border border-white/10 transition-transform group-hover:scale-110",
                                                    section.color
                                                )}>
                                                    <section.icon size={24} />
                                                </div>
                                                <h3 className="font-black text-xl text-white uppercase tracking-tight italic">{section.title}</h3>
                                            </div>
                                            <p className="text-slate-400 text-[13px] font-medium leading-relaxed mb-6">{section.content}</p>
                                            <ul className="space-y-4 pt-6 border-t border-white/5">
                                                {section.details.map((detail, dIdx) => (
                                                    <li key={dIdx} className="flex items-start gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 mt-1" />
                                                        <span className="flex-1">{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] rounded-full border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <Cpu size={14} className="text-cyan-500/40" />
                                            v4.5.2_CORE
                                        </div>
                                        <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] rounded-full border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <Zap size={14} className="text-violet-500/40" />
                                            Active_Uplink
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.5em] italic">Proprietary_Neural_OS</p>
                                </div>
                            </div>
                        </div>

                        {/* Industrial Grid Texture */}
                        <div className="absolute inset-0 industrial-grid opacity-[0.02] pointer-events-none" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
