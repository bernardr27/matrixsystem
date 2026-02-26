'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { NeuralTransfer } from '@/components/NeuralTransfer';

export const DiagnosticsPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            overflow: 'hidden',
            margin: '2rem 0'
        }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={20} color={isOpen ? '#4a9eff' : 'rgba(255,255,255,0.5)'} />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.05em' }}>SYSTEM_DIAGNOSTICS</span>
                </div>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <NeuralTransfer />
                            {/* Future diag tools go here */}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
