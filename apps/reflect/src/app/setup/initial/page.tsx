'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Cpu, HardDrive, Zap, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

const INSTALL_STEPS = [
    { id: 'bios', label: 'BIOS_CHECK', duration: 800 },
    { id: 'kernel', label: 'KERNEL_INJECTION', duration: 1200 },
    { id: 'memory', label: 'ALLOCATING_NEURAL_MEMORY', duration: 1500 },
    { id: 'disk', label: 'FORMATTING_SECURE_VAULT', duration: 1000 },
    { id: 'net', label: 'ESTABLISHING_UPLINK', duration: 1000 },
    { id: 'ui', label: 'LOADING_REFLECT_ECHO_UI_v5.0', duration: 800 },
];

export default function OSInstallPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isComplete) {
            setTimeout(() => {
                localStorage.setItem('reflect_os_installed', 'true');
                router.push('/auth');
            }, 1000);
            return;
        }

        const step = INSTALL_STEPS[currentStep];
        let start = Date.now();

        const timer = setInterval(() => {
            const elapsed = Date.now() - start;
            const p = Math.min(100, (elapsed / step.duration) * 100);
            setProgress(p);

            if (elapsed >= step.duration) {
                clearInterval(timer);
                if (currentStep < INSTALL_STEPS.length - 1) {
                    setCurrentStep(c => c + 1);
                    setProgress(0);
                } else {
                    setIsComplete(true);
                }
            }
        }, 16);

        return () => clearInterval(timer);
    }, [currentStep, isComplete, router]);

    return (
        <div className="h-screen w-full bg-[#020202] text-white overflow-hidden flex flex-col items-center justify-center font-mono relative">

            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Main Installer Window */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10 p-5 sm:p-8 border border-white/10 bg-black/80 backdrop-blur-xl rounded-2xl shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-xs font-bold tracking-[0.2em] text-cyan-400">REFLECT_OS_INSTALLER</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold">V5.0.1</span>
                </div>

                {/* Progress Visual */}
                <div className="space-y-6 mb-8">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-slate-300 tracking-wider">
                            {isComplete ? 'INSTALLATION_COMPLETE' : INSTALL_STEPS[currentStep].label}
                        </span>
                        <span className="text-xs font-mono text-cyan-500">
                            {isComplete ? '100%' : `${Math.round(progress)}%`}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                            style={{ width: `${isComplete ? 100 : progress}%` }}
                        />
                    </div>
                </div>

                {/* Log Stream */}
                <div className="h-32 bg-black/50 rounded-lg border border-white/5 p-4 overflow-hidden flex flex-col justify-end">
                    <AnimatePresence mode="popLayout">
                        {INSTALL_STEPS.slice(0, currentStep + 1).map((step, i) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 last:text-cyan-400 last:font-bold"
                            >
                                {i < currentStep ? <CheckCircle2 size={10} className="text-emerald-500" /> : <div className="w-2 h-2 rounded-full border-t border-l border-cyan-500 animate-spin" />}
                                <span>{step.label}... {i < currentStep ? 'DONE' : ''}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Footer Status */}
                <div className="mt-6 flex justify-between text-[9px] text-slate-600 uppercase tracking-widest">
                    <span>Target: Neural_Vault_01</span>
                    <span>Mode: Secure_Write</span>
                </div>
            </motion.div>

            {/* Bottom Branding */}
            <div className="absolute bottom-8 text-[10px] text-slate-700 font-bold tracking-[0.3em]">
                POWERED BY MATRIX ECOSYSTEM
            </div>
        </div>
    );
}
