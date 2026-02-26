'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { NeuralSurface } from '../ui/NeuralSurface';

const tiles = [
    { id: 'mindset', label: 'Evolve Mindset', icon: '🧠', color: 'var(--accent)', sub: 'CLARITY_V2' },
    { id: 'career', label: 'Solve Career', icon: '🚀', color: '#10b981', sub: 'PATH_EXPAND' },
    { id: 'money', label: 'Wealth Frequency', icon: '💎', color: '#f59e0b', sub: 'ABUNDANCE_SYN' },
    { id: 'relationships', label: 'Bond Dynamics', icon: '⚛️', color: '#ec4899', sub: 'COHESION_UNIT' },
    { id: 'discipline', label: 'Self Discipline', icon: '⚔️', color: '#6366f1', sub: 'WILL_FORGE' },
    { id: 'truth', label: 'Radical Truth', icon: '🍷', color: '#ff4757', sub: 'SHADOW_WORK' },
];

import { ProtocolType } from '@/lib/ai/prompts';

export default function ActionTiles({ onSelect }: { onSelect: (id: ProtocolType, label: string) => void }) {
    return (
        <div style={{
            display: 'flex',
            gap: '1.5rem',
            width: '100%',
            overflowX: 'auto',
            padding: '2rem 1.5rem',
            scrollbarWidth: 'none',
            justifyContent: 'center',
            alignItems: 'center'
        }} className="no-scrollbar">
            {tiles.map((tile) => (
                <div key={tile.id} onClick={() => onSelect(tile.id as ProtocolType, tile.label)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                    <motion.div
                        whileHover={{ scale: 1.05, y: -8 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{ width: '160px', height: '180px' }}
                    >
                        <NeuralSurface
                            variant="glass"
                            style={{
                                padding: '2rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                height: '100%',
                                background: 'var(--surface)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '32px',
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'all 0.4s var(--ease-fluid)',
                                willChange: 'transform, border-color'
                            }}
                            className="action-tile-premium"
                        >
                            <span style={{
                                fontSize: '2.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                filter: `drop-shadow(0 0 15px ${tile.color}40)`,
                                marginBottom: '0.5rem'
                            }}>{tile.icon}</span>

                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: '0.55rem',
                                    fontWeight: 900,
                                    color: tile.color,
                                    letterSpacing: '0.2em',
                                    marginBottom: '0.4rem',
                                    opacity: 0.8,
                                    textTransform: 'uppercase'
                                }}>
                                    {tile.sub}
                                </div>
                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 300,
                                    color: 'var(--foreground)',
                                    lineHeight: 1.2,
                                    letterSpacing: '-0.01em'
                                }}>
                                    {tile.label}
                                </div>
                            </div>
                        </NeuralSurface>
                    </motion.div>
                </div>
            ))}
            <style>{`
                .action-tile-premium:hover {
                    border-color: var(--border-highlight) !important;
                    background: var(--surface-hover) !important;
                    box-shadow: var(--shadow-md) !important;
                }
            `}</style>
        </div>
    );
}
