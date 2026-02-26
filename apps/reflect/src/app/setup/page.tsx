'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CognitiveGateway } from '@/components/ui/CognitiveGateway';
import { NeuralButton } from '@/components/ui/NeuralButton';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { ProfileIcon } from '@/components/ui/ProfileIcons';
import { ARCHETYPES } from '@/lib/ai/archetypes';
import AuthForm from '@/components/AuthForm';
import { cn } from '@/lib/utils';
import { Fingerprint, Database, Zap, Cpu, ShieldCheck } from 'lucide-react';

type SetupStage = 'boot' | 'identity' | 'sync' | 'archetype' | 'vault' | 'auth' | 'complete';

export default function SetupPage() {
    const [stage, setStage] = useState<SetupStage>('boot');
    const [progress, setProgress] = useState(0);
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [selectedArchetype, setSelectedArchetype] = useState<any>(null);
    const [syncLogs, setSyncLogs] = useState<string[]>([]);
    const router = useRouter();
    const supabase = createClient();

    // Boot sequence
    useEffect(() => {
        if (stage === 'boot') {
            let p = 0;
            const interval = setInterval(() => {
                p += 1;
                setProgress(p);
                if (p >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setStage('identity'), 500);
                }
            }, 20);
            return () => clearInterval(interval);
        }
    }, [stage]);

    // Sync logs
    useEffect(() => {
        if (stage === 'sync') {
            const logs = [
                'CONNECTING TO LOCAL COHESION UNIT...',
                'SCANNING VAULT INTEGRITY...',
                'ESTABLISHING NEURAL UPLINK...',
                'CALIBRATING SYNAPTIC PATHS...',
                'SYNCING DISTRIBUTED CONSCIOUSNESS...'
            ];
            let i = 0;
            const interval = setInterval(() => {
                if (i < logs.length) {
                    setSyncLogs(prev => [...prev, logs[i]]);
                    setProgress(40 + (i * 10));
                    i++;
                } else {
                    clearInterval(interval);
                    setTimeout(() => setStage('archetype'), 1000);
                }
            }, 800);
            return () => clearInterval(interval);
        }
    }, [stage]);

    const handleIdentitySubmit = () => {
        if (name && birthDate) {
            setStage('sync');
            setProgress(40);
        }
    };

    const handleArchetypeConfirm = () => {
        if (selectedArchetype) {
            setStage('auth');
            setProgress(90);
        }
    };

    return (
        <CognitiveGateway
            phase={stage === 'boot' ? 'initializing' : stage === 'auth' ? 'authenticating' : 'onboarding'}
            title={
                stage === 'boot' ? 'Initial Boot' :
                    stage === 'identity' ? 'Neural Identity' :
                        stage === 'sync' ? 'System Sync' :
                            stage === 'archetype' ? 'Consciousness Alignment' :
                                'Finalizing Gateway'
            }
            description={
                stage === 'boot' ? 'Preparing holographic interface...' :
                    stage === 'identity' ? 'Establish your digital fingerprint.' :
                        stage === 'sync' ? 'Verifying vault and neural bridges.' :
                            stage === 'archetype' ? 'Select the frequency that resonates with your focus.' :
                                'Secure your workspace behind the neural wall.'
            }
            progress={progress}
            seed={name}
        >
            <AnimatePresence mode="wait">
                {stage === 'identity' && (
                    <motion.div
                        key="identity"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="w-full flex flex-col gap-6"
                    >
                        <div className="space-y-4">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="DESIGNATION"
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-center text-xl font-black tracking-widest text-white placeholder:text-white/20 focus:border-cyan-500/50 outline-none transition-all"
                                    autoFocus
                                />
                                <Fingerprint className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-cyan-500/40 transition-colors" size={20} />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase pl-2">Temporal_Origin</label>
                                    <input
                                        type="date"
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white color-scheme-dark outline-none focus:border-cyan-500/50 transition-all font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <NeuralButton
                            onClick={handleIdentitySubmit}
                            disabled={!name || !birthDate}
                            className="w-full py-6"
                        >
                            <Zap size={16} className="mr-2" />
                            INITIALIZE HANDSHAKE
                        </NeuralButton>
                    </motion.div>
                )}

                {stage === 'sync' && (
                    <motion.div
                        key="sync"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full space-y-4 font-mono"
                    >
                        <div className="bg-black/40 rounded-2xl border border-white/5 p-6 space-y-2 min-h-[160px]">
                            {syncLogs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-[10px] text-cyan-400/60 flex items-center gap-2"
                                >
                                    <span className="text-white/20">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                    <span className="text-white/40">&gt;&gt;</span>
                                    {log}
                                </motion.div>
                            ))}
                            <div className="flex items-center gap-2 text-[10px] text-cyan-400 animate-pulse">
                                <span className="text-white/40">&gt;&gt;</span>
                                PROCESSING...
                            </div>
                        </div>
                        <div className="flex justify-center gap-8 py-4 opacity-40">
                            <Database size={24} className="text-cyan-500 animate-bounce delay-75" />
                            <ShieldCheck size={24} className="text-emerald-500 animate-bounce delay-150" />
                            <Cpu size={24} className="text-purple-500 animate-bounce delay-300" />
                        </div>
                    </motion.div>
                )}

                {stage === 'archetype' && (
                    <motion.div
                        key="archetype"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="w-full space-y-4"
                    >
                        <div className="grid grid-cols-1 gap-3">
                            {ARCHETYPES.slice(0, 3).map((arch) => (
                                <NeuralSurface
                                    key={arch.id}
                                    onClick={() => setSelectedArchetype(arch)}
                                    className={cn(
                                        "p-5 cursor-pointer border transition-all duration-500",
                                        selectedArchetype?.id === arch.id
                                            ? "border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                                            : "border-white/5 bg-white/[0.01] hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-5 italic">
                                        <ProfileIcon type={arch.icon} color={arch.color} size={40} active={selectedArchetype?.id === arch.id} />
                                        <div className="text-left flex-1 min-w-0">
                                            <h4 className="text-xs font-black tracking-[0.2em] mb-1" style={{ color: arch.color }}>{arch.name}</h4>
                                            <p className="text-[10px] text-slate-500 truncate">{arch.description}</p>
                                        </div>
                                        {selectedArchetype?.id === arch.id && (
                                            <motion.div layoutId="check" className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                        )}
                                    </div>
                                </NeuralSurface>
                            ))}
                        </div>
                        <NeuralButton
                            onClick={handleArchetypeConfirm}
                            disabled={!selectedArchetype}
                            className="w-full mt-4"
                        >
                            CONFIRM ALIGNMENT
                        </NeuralButton>
                    </motion.div>
                )}

                {stage === 'auth' && (
                    <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                        <AuthForm
                            onboardingData={{
                                name,
                                archetypeData: selectedArchetype,
                                astra: { birthDate }
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </CognitiveGateway>
    );
}
