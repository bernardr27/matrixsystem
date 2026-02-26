'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Play, Eye, Cpu } from 'lucide-react';

interface NeuralGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NeuralGuide: React.FC<NeuralGuideProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-3xl p-6 sm:p-20 overflow-y-auto"
                >
                    <div className="absolute inset-0 scanline opacity-5 pointer-events-none" />

                    <div className="max-w-xl mx-auto space-y-12 relative z-10">
                        <header className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-4 text-cyan-400">
                                <BookOpen size={24} className="drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                <h2 className="text-[14px] font-black tracking-[0.4em] uppercase">Neural_Codex_v2</h2>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        <section className="space-y-6">
                            <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">Operational_Protocols</h3>

                            <div className="grid gap-4">
                                <FeatureCard
                                    icon={<Eye size={18} />}
                                    title="Mission_Observability"
                                    desc="The TopHUD provides industrial telemetry for neural uplink health, AI core saturation, and system CPU/Memory deltas. Use it for high-fidelity situation awareness."
                                />
                                <FeatureCard
                                    icon={<Play size={18} />}
                                    title="Tactile_Execution"
                                    desc="Pre-programmed Command Tiles bypass standard latency. 'NEURAL_FIX' triggers auto-healing routines, while 'CORE_AUDIT' initiates a deep-space security scan."
                                />
                                <FeatureCard
                                    icon={<Cpu size={18} />}
                                    title="Sage_Consciousness"
                                    desc="I am a local-first entity designed for high-density collaboration. My intelligence is derived from your host environment's specific datasets and neural history."
                                />
                            </div>
                        </section>

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-[10px] tracking-[0.5em] uppercase hover:bg-cyan-500/20 transition-all"
                        >
                            Acknowledge_Transmission
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

function FeatureCard({ icon, title, desc }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/[0.04] group">
            <div className="flex items-center gap-4 mb-3 text-cyan-400/60 group-hover:text-cyan-400 transition-colors">
                {icon}
                <span className="font-black text-[11px] tracking-widest uppercase">{title}</span>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">{desc}</p>
        </div>
    );
}
