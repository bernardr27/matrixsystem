'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { NexusNavbar } from './NexusNavbar';
import { ModularCommandBar } from './ModularCommandBar';
import { useTelemetry } from '../providers/TelemetryProvider';
import { SystemIntegrityNotice } from './SystemIntegrityNotice';
import { X } from 'lucide-react';

const NexusGate = dynamic(
    () => import('../diagnostics/NexusGate').then(m => ({ default: m.NexusGate })),
    { loading: () => <div className="h-64 animate-pulse bg-white/5 rounded-3xl" /> }
);

/* ═══════════════════════════════════════════════════════
   NEXUS SHELL v6.0 — Deep space ambient, teal mesh
   Top: 48px bar · Bottom: 52px mobile dock
   ═══════════════════════════════════════════════════════ */

export function NexusShell({ children }: { children: React.ReactNode }) {
    const { isGateOpen, setGateOpen } = useTelemetry();

    return (
        <div className="relative min-h-screen overflow-x-hidden overscroll-none touch-auto bg-[#070a10]">
            <SystemIntegrityNotice />

            {/* Deep mesh gradient — teal/emerald theme */}
            <div className="fixed inset-0 pointer-events-none z-0" style={{
                background: `
                    radial-gradient(ellipse 70% 50% at 10% 20%, rgba(45,212,191,0.04) 0%, transparent 60%),
                    radial-gradient(ellipse 50% 40% at 90% 80%, rgba(16,185,129,0.03) 0%, transparent 60%),
                    radial-gradient(ellipse 80% 60% at 50% 50%, rgba(59,130,246,0.02) 0%, transparent 70%)
                `
            }} />

            {/* Subtle dot grid texture — unique to Nexus */}
            <div
                className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(45,212,191,0.4) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                }}
            />

            <ModularCommandBar />
            <NexusNavbar />

            <main
                className="relative z-10 min-h-screen"
                style={{
                    paddingTop: 'calc(48px + env(safe-area-inset-top, 0px))',
                    paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                }}
            >
                {children}
            </main>

            {/* Gate Modal */}
            <AnimatePresence>
                {isGateOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl pointer-events-auto"
                        onClick={() => setGateOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-end mb-4">
                                <button type="button"
                                    onClick={() => setGateOpen(false)}
                                    className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] text-white/40 hover:text-white transition-all border border-white/[0.06]"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <NexusGate />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
