'use client';

import { ReflectMode } from '@/lib/ai/types';

interface QuoteCardProps {
    reframe: string;
    mode: ReflectMode;
    onClose: () => void;
}

export default function QuoteCard({ reframe, mode, onClose }: QuoteCardProps) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.9)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem'
        }}>
            <div
                id="share-card"
                style={{
                    background: `linear-gradient(135deg, #111 0%, var(--mode-${mode}) 200%)`,
                    border: `1px solid var(--mode-${mode})`,
                    padding: '3rem 2rem',
                    borderRadius: '16px',
                    maxWidth: '350px',
                    width: '100%',
                    aspectRatio: '1/1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    textAlign: 'center'
                }}
            >
                <span style={{ fontSize: '3rem', lineHeight: 1, opacity: 0.3, alignSelf: 'start' }}>“</span>
                <p style={{
                    fontSize: '1.4rem',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    color: '#fff',
                    fontFamily: 'serif'
                }}>
                    {reframe}
                </p>
                <div style={{ alignSelf: 'center', marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Reflect App
                    </span>
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Take a screenshot to share!</p>
                <button onClick={onClose} style={{
                    background: 'transparent',
                    border: '1px solid #444',
                    color: '#fff',
                    padding: '0.75rem 2rem',
                    borderRadius: '50px',
                    cursor: 'pointer'
                }}>
                    Close
                </button>
            </div>
        </div>
    );
}
