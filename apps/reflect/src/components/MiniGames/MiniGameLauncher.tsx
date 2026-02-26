'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralSurface } from '../ui/NeuralSurface';
import { Portal } from '../ui/Portal';
import MemoryMatrix from './MemoryMatrix';
import ZenSnake from './ZenSnake';
import EchoSequence from './EchoSequence';
import { PatternPulse, NeuralLink, FocusStream, QuantumLeap, CipherBreak, FluxRunner, VoidVortex } from './NewGames';

type GameType = 'memory' | 'snake' | 'echo' | 'pulse' | 'link' | 'stream' | 'quantum' | 'cipher' | 'flux' | 'vortex' | null;

export default function MiniGameLauncher() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeGame, setActiveGame] = useState<GameType>(null);

    const GAMES = [
        { id: 'memory', title: 'Memory Matrix', desc: 'Recall pattern retention.', icon: '🧠', color: '#3b82f6' },
        { id: 'snake', title: 'Zen Snake', desc: 'Flow state navigation.', icon: '🐍', color: '#10b981' },
        { id: 'echo', title: 'Echo Sequence', desc: 'Auditory resonance.', icon: '🔊', color: '#ec4899' },
        { id: 'pulse', title: 'Pattern Pulse', desc: 'Visual rhythm sync.', icon: '⚡', color: '#f59e0b' },
        { id: 'link', title: 'Neural Link', desc: 'Spatial connection.', icon: '🔗', color: '#8b5cf6' },
        { id: 'stream', title: 'Focus Stream', desc: 'Attention endurance.', icon: '🌊', color: '#06b6d4' },
        { id: 'quantum', title: 'Quantum Leap', desc: 'Reaction timing.', icon: '⚛️', color: '#f87171' },
        { id: 'cipher', title: 'Cipher Break', desc: 'Logic decoding.', icon: '🔐', color: '#fb923c' },
        { id: 'flux', title: 'Flux Runner', desc: 'Avoidance agility.', icon: '🏃', color: '#4ade80' },
        { id: 'vortex', title: 'Void Vortex', desc: 'Orbital physics.', icon: '🌀', color: '#a78bfa' }
    ];

    const handleExitGame = () => setActiveGame(null);

    return (
        <>
            {/* Widget Trigger */}
            {/* Widget Trigger - Rainbow Border Edition */}
            <div style={{ position: 'relative', borderRadius: '24px', padding: '1.5px', overflow: 'hidden', width: '100%', maxWidth: '380px' }}>
                {/* Rotating Rainbow Gradient */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        inset: '-50%',
                        width: '200%',
                        height: '200%',
                        // Double spectrum for "racing" density
                        background: 'conic-gradient(from 0deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                        zIndex: 0,
                        filter: 'blur(5px)' // Adds a bit of bleed/speed trail feel
                    }}
                />

                {/* Inner Content Card */}
                <motion.button
                    layoutId="launcher-card"
                    onClick={() => setIsOpen(true)}
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        background: '#0a0a0f', // Match boot dark
                        borderRadius: '22.5px', // Slightly less than outer to fit
                        padding: '1.5rem 2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between', // Spaced out layout
                        gap: '1rem',
                        cursor: 'pointer',
                        color: '#fff',
                        outline: 'none',
                        border: 'none',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            fontSize: '1.5rem',
                            filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))'
                        }}>
                            👾
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{
                                fontSize: '1rem',
                                fontWeight: 800,
                                letterSpacing: '0.1em',
                                background: 'linear-gradient(90deg, #fff, #888)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                ARCADE_MODE
                            </div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '0.05em' }}>
                                6 MODULES READY
                            </div>
                        </div>
                    </div>

                    <div style={{
                        opacity: 0.8,
                        transform: 'rotate(0deg)',
                        background: 'rgba(255,255,255,0.1)',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem'
                    }}>
                        ▶
                    </div>
                </motion.button>
            </div>

            {/* Pop-up Interface - Portalled to Body */}
            <AnimatePresence>
                {isOpen && (
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                zIndex: 999999, // Ensure absolute top
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(5, 5, 8, 0.7)', // Slightly darker
                                backdropFilter: 'blur(12px)', // Stronger blur
                                padding: '1rem'
                            }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setIsOpen(false);
                            }}
                        >
                            <motion.div
                                layoutId="launcher-card"
                                style={{
                                    width: '100%',
                                    maxWidth: '800px',
                                    maxHeight: '90vh',
                                    outline: 'none',
                                    pointerEvents: 'auto'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <NeuralSurface
                                    variant="glass"
                                    style={{
                                        padding: 'clamp(1rem, 5vw, 2rem)', // Mobile friendly padding
                                        borderRadius: '32px',
                                        background: 'rgba(15, 15, 20, 0.95)', // Slightly more opaque
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1.5rem',
                                        boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                                        height: 'auto', // Allow it to flex
                                        maxHeight: '85vh', // Ensure it fits in viewport
                                        width: '90vw', // Mobile width
                                        maxWidth: '800px', // Desktop max
                                        overflow: 'hidden', // Contain scrolling children
                                        position: 'relative'
                                    }}
                                >
                                    {/* Header */}
                                    {!activeGame && (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            paddingBottom: '1rem'
                                        }}>
                                            <div>
                                                <h2 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>Neural Arcade</h2>
                                                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>Select a cognitive protocol</p>
                                            </div>
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '32px',
                                                    height: '32px',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >✕</button>
                                        </div>
                                    )}

                                    {/* Game Grid */}
                                    <AnimatePresence mode="wait">
                                        {!activeGame ? (
                                            <motion.div
                                                key="grid"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', // Smaller min for mobile
                                                    gap: '1rem',
                                                    width: '100%',
                                                    overflowY: 'auto',
                                                    padding: '0.5rem',
                                                    maxHeight: '100%', // Ensure it respects parent
                                                    flex: 1, // Take available space
                                                    minHeight: 0 // Allow shrinking for scroll
                                                }}
                                            >
                                                {GAMES.map(game => (
                                                    <motion.button
                                                        key={game.id}
                                                        whileHover={{ scale: 1.03, y: -2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setActiveGame(game.id as GameType)}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.03)',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            borderRadius: '20px',
                                                            padding: '1.5rem 1rem',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '0.8rem',
                                                            cursor: 'pointer',
                                                            color: '#fff',
                                                            textAlign: 'center',
                                                            position: 'relative',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <div style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            background: `linear-gradient(180deg, transparent 0%, ${game.color}20 100%)`,
                                                            opacity: 0.5
                                                        }} />
                                                        <div style={{
                                                            fontSize: '2rem',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            width: '60px',
                                                            height: '60px',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: `0 0 20px ${game.color}20`,
                                                            zIndex: 1
                                                        }}>
                                                            {game.icon}
                                                        </div>
                                                        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{game.title}</span>
                                                            <span style={{ fontSize: '0.65rem', opacity: 0.6, lineHeight: 1.2 }}>{game.desc}</span>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="game-container"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    position: 'relative'
                                                }}
                                            >
                                                {/* In-Game Header - Removed */}

                                                {/* Game Canvas */}
                                                <div style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    overflow: 'hidden'
                                                }}>
                                                    {activeGame === 'memory' && <MemoryMatrix onExit={handleExitGame} />}
                                                    {activeGame === 'snake' && <ZenSnake onExit={handleExitGame} />}
                                                    {activeGame === 'echo' && <EchoSequence onExit={handleExitGame} />}
                                                    {activeGame === 'pulse' && <PatternPulse onExit={handleExitGame} />}
                                                    {activeGame === 'link' && <NeuralLink onExit={handleExitGame} />}
                                                    {activeGame === 'stream' && <FocusStream onExit={handleExitGame} />}
                                                    {activeGame === 'quantum' && <QuantumLeap onExit={handleExitGame} />}
                                                    {activeGame === 'cipher' && <CipherBreak onExit={handleExitGame} />}
                                                    {activeGame === 'flux' && <FluxRunner onExit={handleExitGame} />}
                                                    {activeGame === 'vortex' && <VoidVortex onExit={handleExitGame} />}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </NeuralSurface>
                            </motion.div>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>
        </>
    );
}
