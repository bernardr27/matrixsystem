'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type DashboardPhase = 'RITUAL' | 'IDENTITY' | 'VAULT' | 'FIELD';

interface PhaseSelectorProps {
    activePhase: DashboardPhase;
    onPhaseChange: (phase: DashboardPhase) => void;
}

const phases: { id: DashboardPhase; label: string }[] = [
    { id: 'RITUAL', label: 'RITUAL' },
    { id: 'IDENTITY', label: 'IDENTITY' },
    { id: 'VAULT', label: 'VAULT' },
    { id: 'FIELD', label: 'FIELD' }
];

export default function PhaseSelector({ activePhase, onPhaseChange }: PhaseSelectorProps) {
    return (
        <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
                position: 'sticky',
                top: 'calc(var(--header-height) - 10px)',
                left: 0,
                right: 0,
                zIndex: 900,
                display: 'flex',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom, var(--background) 0%, var(--surface-glass) 100%)',
                backdropFilter: 'blur(var(--glass-blur))',
                padding: '0.4rem 0',
                boxSizing: 'border-box',
                borderBottom: '1px solid var(--border-subtle)',
                containerType: 'inline-size',
                margin: '0 -1rem' // Pull out to edges if needed, but safe layout will handle it
            }}
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${phases.length}, 1fr)`,
                    gap: '1vw',
                    width: '100%',
                    maxWidth: '900px',
                    padding: '0 5vw',
                    boxSizing: 'border-box',
                    alignItems: 'center'
                }}
            >
                {phases.map((phase) => (
                    <button
                        key={phase.id}
                        onClick={() => onPhaseChange(phase.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: activePhase === phase.id ? 'var(--foreground)' : 'var(--foreground)',
                            opacity: activePhase === phase.id ? 1 : 0.2,
                            fontSize: 'clamp(0.6rem, 1.8vw, 0.7rem)',
                            fontWeight: 900,
                            letterSpacing: '0.4em',
                            cursor: 'pointer',
                            padding: '1rem 0',
                            position: 'relative',
                            transition: 'all 0.4s var(--ease-fluid)',
                            whiteSpace: 'nowrap',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.6rem'
                        }}
                    >
                        <span style={{ transform: activePhase === phase.id ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.4s' }}>
                            {phase.label}
                        </span>

                        {activePhase === phase.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                style={{
                                    width: '24px',
                                    height: '2px',
                                    background: 'var(--accent)',
                                    boxShadow: '0 0 15px var(--accent-glow)',
                                    borderRadius: '100px'
                                }}
                            />
                        )}

                        {activePhase !== phase.id && (
                            <div style={{ width: '24px', height: '2px', background: 'transparent' }} />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
