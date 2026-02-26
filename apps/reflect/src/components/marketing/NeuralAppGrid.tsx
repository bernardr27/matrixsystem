'use client';

import React from 'react';
import { motion } from 'framer-motion';

const AppIcons = {
    reflect: (color: string) => (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 md:w-10 md:h-10">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            <circle cx="12" cy="12" r="4" fill={color} fillOpacity="0.2" />
        </svg>
    ),
    features: (color: string) => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9Z" />
            <path d="M12 8v8M8 12h8" />
        </svg>
    ),
    settings: (color: string) => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    insights: (color: string) => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
            <path d="m14 14 3 3" />
        </svg>
    )
};

const apps = [
    { id: 'reflect', label: 'REFLECT', color: '#3b82f6' },
    { id: 'features', label: 'MANIFESTO', color: '#10b981' },
    { id: 'insights', label: 'INSIGHTS', color: '#ec4899' }
];

export default function NeuralAppGrid({ onSelect }: { onSelect: (id: string) => void }) {
    return (
        <div style={{
            display: 'flex',
            gap: 'clamp(2rem, 5vw, 4rem)', // Increased gap
            marginTop: '1rem',
            zIndex: 10,
            width: '100%',
            justifyContent: 'center',
            flexWrap: 'wrap' // Allow wrapping on small screens
        }}>
            {apps.map((app) => (
                <motion.button
                    key={app.id}
                    onClick={() => onSelect(app.id)}
                    whileHover={{ scale: 1.05, translateY: -5 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.8rem',
                        minWidth: '80px' // Ensure stable touch target width
                    }}
                >
                    <div style={{
                        width: 'clamp(64px, 12vw, 80px)', // Scalable icon
                        height: 'clamp(64px, 12vw, 80px)',
                        borderRadius: '24px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)'
                    }} className="app-icon-container">
                        <div style={{
                            position: 'absolute',
                            inset: -1,
                            borderRadius: '24px',
                            border: `1.5px solid ${app.color}`,
                            opacity: 0,
                            filter: `blur(4px) drop-shadow(0 0 8px ${app.color}40)`,
                            transition: 'opacity 0.4s'
                        }} className="icon-glow" />

                        <div style={{
                            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.1))',
                            zIndex: 2
                        }}>
                            {AppIcons[app.id as keyof typeof AppIcons](app.color)}
                        </div>

                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.08, 0.03] }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '24px',
                                background: app.color,
                                zIndex: -1
                            }}
                        />
                    </div>
                    <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        letterSpacing: '0.2rem',
                        color: 'rgba(255,255,255,0.35)',
                        transition: 'all 0.4s'
                    }} className="app-label">{app.label}</span>

                    <style jsx>{`
                        button:hover .icon-glow { opacity: 0.5 !important; }
                        button:hover .app-icon-container { border-color: ${app.color}60 !important; background: rgba(255,255,255,0.04) !important; }
                        button:hover .app-label { color: #fff !important; letter-spacing: 0.25rem !important; }
                    `}</style>
                </motion.button>
            ))}
        </div>
    );
}
