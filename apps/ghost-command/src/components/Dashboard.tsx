'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SageProvider, useSage } from '@/context/SageContext';
import { BootSplash } from '@/components/BootSplash';
import { NeuralGuide } from '@/components/NeuralGuide';
import { VisualReflex } from '@/components/debug/VisualReflex';
import { NeuralUpdater } from '@/components/debug/NeuralUpdater';
import { GlobalNeuralErrorBoundary } from '@/components/debug/GlobalNeuralErrorBoundary';
import { MatrixDevHUD } from '@/components/debug/MatrixDevHUD';
import { CommandDock, type GhostModule } from '@/components/ui/CommandDock';
import { NeuralChat } from '@/components/NeuralChat';
import { Shield, Zap, Terminal as TerminalIcon, Sparkles, Activity } from 'lucide-react';
import { useSynthesizer } from '@/hooks/useSynthesizer';
import { useDiagnostic } from '@/components/providers/DiagnosticProvider';

// V2 COMPONENTS
import { GhostLayout } from './v2/GhostLayout';
import { TopHUD } from './v2/TopHUD';
// Console replaced by NeuralChat
import { Terminal } from './v2/Terminal';
import { MatrixExplorer } from './v2/MatrixExplorer';
import { NeuralInput } from './v2/NeuralInput';
import MissionBoard from './v2/MissionBoard';
import NeuralTerminal from './v2/NeuralTerminal';
import { TriagePanel } from './TriagePanel';
import { NeuralTransfer } from './NeuralTransfer';
import { cn } from '@/lib/utils';

function DashboardContent() {
    const [showGuide, setShowGuide] = useState(false);
    const [showDiag, setShowDiag] = useState(false);
    const [activeModule, setActiveModule] = useState<GhostModule>('chat');
    const [input, setInput] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const { lastResponse, status, sendCommand } = useSage();
    const voice = useSynthesizer();
    const diag = useDiagnostic();

    // Mounting Logic
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSend = async () => {
        if (!input.trim()) return;
        diag.startTimer('command_send');
        await sendCommand(input);
        diag.endTimer('command_send', 'sage_command_sent', { command: input.substring(0, 50) });
        setInput('');
    };

    // Auto-read new responses
    const voiceEnabled = voice.enabled;
    const voiceSpeak = voice.speak;
    useEffect(() => {
        if (lastResponse && voiceEnabled) {
            voiceSpeak(lastResponse);
        }
    }, [lastResponse, voiceEnabled, voiceSpeak]);

    // Scroll Reset Logic
    const mainRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTop = 0;
        }
    }, [activeModule]);

    if (!isMounted) return null;

    return (
        <GhostLayout>
            <BootSplash />
            <VisualReflex />
            <NeuralUpdater />
            <MatrixDevHUD isOpen={showDiag} onClose={() => setShowDiag(false)} />
            <NeuralGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

            {/* HEADER - FIXED Z-INDEX */}
            <div className="flex-none z-[60] relative">
                <TopHUD
                    onShowGuide={() => setShowGuide(true)}
                    onToggleDiag={() => setShowDiag(!showDiag)}
                />
            </div>

            {/* MAIN SCROLL AREA */}
            <motion.main
                ref={mainRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="flex-1 overflow-y-auto scrollbar-none relative z-0 pt-20 pb-24 px-4 sm:px-6 overscroll-contain"
            >
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* MOBILE MODULE SWITCHER (GRID ON DESKTOP) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* LEFT/MAIN COLUMN: CONSOLE & INPUT */}
                        <div className={cn(
                            "lg:col-span-7 space-y-6 transition-all duration-500",
                            activeModule === 'chat' ? "block" : "hidden lg:block"
                        )}>
                            <NeuralChat />
                        </div>

                        {/* RIGHT/SIDE COLUMN: DATA & ACTIONS */}
                        <div className={cn(
                            "lg:col-span-5 space-y-8 transition-all duration-500",
                            activeModule !== 'chat' ? "block" : "hidden lg:block"
                        )}>
                            <div className={cn(
                                "transition-opacity duration-300",
                                activeModule === 'chat' ? "block opacity-100" : "hidden lg:block opacity-40 hover:opacity-100"
                            )}>
                                <NeuralTerminal />
                            </div>

                            {/* LIVE FILE EXPLORER / SYSTEM MODULE */}
                            <div className={cn(
                                "transition-opacity duration-300",
                                activeModule === 'system' ? "block opacity-100" : "hidden lg:block opacity-40 hover:opacity-100"
                            )}>
                                <MatrixExplorer isActive={activeModule === 'system'} />
                            </div>

                            {/* DATA MODULES (Terminal / Mission Board) */}
                            <div className={cn(
                                "flex flex-col gap-8",
                                activeModule === 'logs' ? "block" : (activeModule === 'transfer' ? "block" : "hidden lg:block")
                            )}>
                                {(activeModule === 'logs' || activeModule === 'chat' || activeModule === 'system') && <Terminal />}
                                {(activeModule === 'chat' || activeModule === 'system') && <MissionBoard />}
                                {activeModule === 'transfer' && (
                                    <div className="space-y-8">
                                        <NeuralTransfer />
                                        <TriagePanel />
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </motion.main>

            {/* COMMAND DOCK - FLOATING Z-INDEX */}
            <CommandDock activeModule={activeModule} onModuleChange={setActiveModule} />
        </GhostLayout>
    );
}

export default function Dashboard() {
    return (
        <GlobalNeuralErrorBoundary>
            <SageProvider>
                <DashboardContent />
            </SageProvider>
        </GlobalNeuralErrorBoundary>
    );
}
