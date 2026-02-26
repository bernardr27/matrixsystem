'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralButton } from '@/components/ui/NeuralButton';
import SubPageSelector, { SubPageTab } from '@/components/ui/SubPageSelector';
import OracleChat from '@/components/Oracle/OracleChat';
import { Lock, Sparkles, Globe, BookOpen, PenTool, Feather } from 'lucide-react';

interface JournalEntry {
    id: string;
    created_at: string;
    initial_input: string;
    mode: string;
    unlock_at?: string;
    image_url?: string;
}

interface ZenJournalProps {
    initialSessions: JournalEntry[];
}

const ZEN_TABS: SubPageTab[] = [
    { id: 'oracle', label: 'Oracle', icon: '🔮' },
    { id: 'records', label: 'Chronicle', icon: '📜' }, // Renamed for Vibe
    { id: 'insights', label: 'Wisdom', icon: '✨' },
    { id: 'collective', label: 'Ether', icon: '🌐' }
];

export default function ZenJournal({ initialSessions }: ZenJournalProps) {
    const [activeTab, setActiveTab] = useState('oracle');

    return (
        <div className="w-full max-w-4xl mx-auto min-h-screen">
            <div className="mb-12 flex justify-center">
                <SubPageSelector
                    tabs={ZEN_TABS}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    accentColor="rgba(255,255,255,0.8)" // White accent for Zen
                />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    {activeTab === 'oracle' && <OracleChat />}
                    {activeTab === 'records' && <ZenRecords sessions={initialSessions} />}
                    {activeTab === 'insights' && <ZenPlaceholder icon={Sparkles} title="Pattern Recognition" />}
                    {activeTab === 'collective' && <ZenPlaceholder icon={Globe} title="Global Consciousness" />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function ZenRecords({ sessions }: { sessions: JournalEntry[] }) {
    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 opacity-30 gap-4">
                <Feather className="w-12 h-12" strokeWidth={1} />
                <span className="font-serif italic text-lg">The page is blank.</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-12 pb-32">
            {sessions.map((session, i) => (
                <ZenCard key={session.id} session={session} index={i} />
            ))}
        </div>
    );
}

function ZenCard({ session, index }: { session: JournalEntry, index: number }) {
    const isLocked = session.unlock_at && new Date(session.unlock_at) > new Date();
    const date = new Date(session.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
            className="group relative"
        >
            {/* The "Zen Glass" Container */}
            <div className="relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/[0.05] p-8 md:p-12 transition-all duration-700 hover:bg-white/[0.04] hover:border-white/10 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">

                {/* Background Image Blend */}
                {session.image_url && (
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-700">
                        <div
                            className="absolute inset-0 bg-cover bg-center grayscale mix-blend-overlay"
                            style={{ backgroundImage: `url(${session.image_url})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
                    </div>
                )}

                <div className="relative z-10 flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex justify-between items-baseline border-b border-white/5 pb-6">
                        <span className="font-serif text-xl md:text-2xl text-white/90 italic tracking-wide">
                            {date}
                        </span>
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/30">
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: `var(--mode-${session.mode})`,
                                    boxShadow: `0 0 10px var(--mode-${session.mode})`
                                }}
                            />
                            {session.mode}
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`font-light text-lg md:text-xl leading-relaxed text-white/70 max-w-2xl ${isLocked ? 'blur-sm select-none' : ''}`}>
                        {isLocked ? "This memory is currently sealed by a temporal lock." : session.initial_input}
                    </div>

                    {/* Footer / Action */}
                    <div className="flex justify-between items-center pt-4">
                        {isLocked ? (
                            <div className="flex items-center gap-3 text-white/40">
                                <Lock size={16} />
                                <span className="text-xs tracking-widest uppercase">Sealed</span>
                            </div>
                        ) : (
                            <NeuralButton
                                href={`/journal/${session.id}`}
                                variant="ghost"
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <span className="font-serif italic">Read Entry</span>
                            </NeuralButton>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ZenPlaceholder({ icon: Icon, title }: { icon: any, title: string }) {
    return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 text-white/30">
            <div className="p-8 rounded-full bg-white/[0.02] border border-white/[0.05]">
                <Icon size={32} strokeWidth={1} />
            </div>
            <h3 className="font-serif text-2xl italic">{title}</h3>
        </div>
    );
}
