'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from '../ui/NeuralSurface';
import { NeuralButton } from '../ui/NeuralButton';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { DiagnosticsPanel } from '../DiagnosticsPanel';
import { NotificationManager } from './NotificationManager';

const Toggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <div
        onClick={onToggle}
        style={{
            width: '48px',
            height: '26px',
            borderRadius: '20px',
            background: active ? 'var(--accent)' : 'var(--border-subtle)',
            padding: '3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: active ? 'flex-end' : 'flex-start',
            transition: 'all 0.4s var(--ease-fluid)',
            boxShadow: active ? '0 0 15px var(--accent-glow)' : 'none',
        }}
    >
        <motion.div
            layout
            style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#fff',
                boxShadow: 'var(--shadow-sm)',
                willChange: 'transform',
            }}
        />
    </div>
);

export default function Settings() {
    const { theme, toggleTheme } = useTheme();
    const [preferences, setPreferences] = useState({
        aiRefraction: true,
        safeMode: false,
        neuralPersistence: true,
        visualDebugger: false,
    });

    React.useEffect(() => {
        if (preferences.visualDebugger) {
            document.body.classList.add('debug-layout');
        } else {
            document.body.classList.remove('debug-layout');
        }
    }, [preferences.visualDebugger]);

    const togglePref = (key: keyof typeof preferences) => {
        setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', animation: 'fadeIn 0.6s var(--ease-fluid)' }}>
            {/* Header Area */}
            <div style={{ paddingBottom: '2.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <h2 className="text-4xl md:text-5xl font-thin tracking-tight text-foreground mb-3">Core Settings</h2>
                <p style={{ color: 'var(--foreground)', opacity: 0.4, fontSize: '0.95rem', letterSpacing: '0.01em', fontWeight: 300 }}>
                    Configure your neural environment and account sovereignty.
                </p>
            </div>

            {/* Global Theme Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2rem', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.1rem', color: 'var(--foreground)', fontWeight: 300 }}>System Aesthetics</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.3 }}>
                        {theme === 'dark' ? 'SYNCHRONIZED_TO_DARK_MODE' : 'SYNCHRONIZED_TO_LIGHT_MODE'}
                    </span>
                </div>
                <div style={{ display: 'center', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--foreground)', opacity: 0.2 }}>{theme.toUpperCase()}</span>
                    <Toggle active={theme === 'dark'} onToggle={toggleTheme} />
                </div>
            </div>

            {/* Profile Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 className="text-[10px] font-black tracking-[0.3em] text-foreground opacity-30 uppercase">IDENTITY</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '40px',
                                background: 'var(--surface-higher)',
                                border: '1px solid var(--border-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                boxShadow: 'var(--shadow-md)',
                            }}
                        >
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="1" style={{ opacity: 0.1 }}>
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <NeuralButton variant="ghost" size="sm" style={{ height: '40px' }}>
                            UPDATE_PROTOCOL
                        </NeuralButton>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <span className="text-[10px] font-black tracking-[0.2em] text-foreground opacity-30 uppercase">USERNAME</span>
                        <input
                            type="text"
                            disabled
                            value="Sovereign_User"
                            style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border-subtle)',
                                padding: '1.2rem',
                                color: 'var(--foreground)',
                                borderRadius: '14px',
                                fontSize: '0.95rem',
                                opacity: 0.6,
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <span className="text-[10px] font-black tracking-[0.2em] text-foreground opacity-30 uppercase">EMAIL_ANCHOR</span>
                        <input
                            type="email"
                            placeholder="anchor@reflect.so"
                            style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border-subtle)',
                                padding: '1.2rem',
                                color: 'var(--foreground)',
                                borderRadius: '14px',
                                fontSize: '0.95rem',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Settings Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h3 className="text-[10px] font-black tracking-[0.3em] text-foreground opacity-30 uppercase mb-2">PREFERENCES</h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {[
                        { key: 'aiRefraction', label: 'Advanced AI Refraction', desc: 'Enable deep neural lensing for semantic thought analysis.' },
                        { key: 'neuralPersistence', label: 'Neural Persistence', desc: 'Sovereign synchronization across your authorized nodes.' },
                        { key: 'safeMode', label: 'Strict Safe Mode', desc: 'Isolate cognition by suspending all network-bound nodes.' },
                        { key: 'visualDebugger', label: 'Visual Diagnostics', desc: '[DEV] Highlight component boundaries to identify UI misalignments.' },
                    ].map((item) => (
                        <div
                            key={item.key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1.5rem 2rem',
                                background: 'var(--surface)',
                                borderRadius: '20px',
                                border: '1px solid var(--border-subtle)',
                                transition: 'all 0.3s var(--ease-fluid)',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <span style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 300 }}>{item.label}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--foreground)', opacity: 0.3, fontWeight: 300 }}>{item.desc}</span>
                            </div>
                            <Toggle active={preferences[item.key as keyof typeof preferences]} onToggle={() => togglePref(item.key as keyof typeof preferences)} />
                        </div>
                    ))}
                    <NotificationManager />
                </div>
            </div>

            {/* Diagnostics */}
            <DiagnosticsPanel />

            {/* Tier Management */}
            <NeuralSurface variant="glass" style={{ padding: '3rem', borderRadius: '32px', border: '1px solid var(--border-subtle)', marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 100, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>Current Protocol: Essence Tier</h3>
                    <div style={{ padding: '0.5rem 1.2rem', borderRadius: '100px', background: 'var(--accent)', boxShadow: '0 4px 20px var(--accent-glow)' }}>
                        <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 900, letterSpacing: '0.2em' }}>ACTIVE_PLATFORM</span>
                    </div>
                </div>
                <p style={{ color: 'var(--foreground)', opacity: 0.4, fontSize: '1rem', maxWidth: '500px', marginBottom: '2.5rem', lineHeight: 1.6, fontWeight: 300 }}>
                    You are established in the Essence core. Transcendence tiers provide multi-dimensional cognitive analysis and infinite neural storage.
                </p>
                <NeuralButton variant="ghost" style={{ width: 'fit-content' }}>
                    TRANSCEND_NOW
                </NeuralButton>
            </NeuralSurface>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--foreground)', opacity: 0.1, fontWeight: 900, letterSpacing: '0.4em' }}>REFLECT_OS_V4.0.2_KRNL_STABLE</span>
            </div>
        </div>
    );
}
