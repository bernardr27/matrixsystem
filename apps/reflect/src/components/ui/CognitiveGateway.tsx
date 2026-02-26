'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GenerativeBackground } from '../ui/GenerativeBackground';
import { NeuralSurface } from '../ui/NeuralSurface';

interface CognitiveGatewayProps {
    phase: 'authenticating' | 'onboarding' | 'initializing' | 'finalizing';
    title: string;
    description: string;
    progress?: number;
    children?: React.ReactNode;
    onComplete?: () => void;
    seed?: string; // Add seed prop
}

export const CognitiveGateway: React.FC<CognitiveGatewayProps> = ({
    phase,
    title,
    description,
    progress = 0,
    children,
    onComplete,
    seed
}) => {
    return (
        <main className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center relative bg-[var(--background)]">
            {/* Generative Background */}
            <GenerativeBackground seed={seed} />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-20 sm:h-32 bg-gradient-to-b from-[var(--background)] to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-20 sm:h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
            </div>

            {/* Scrollable Container for tall content */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center overflow-y-auto scrollbar-hide px-4 py-6 sm:px-8 sm:py-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-[480px] flex flex-col items-center flex-shrink-0"
                >
                    {/* Brand Header */}
                    <div className="mb-6 sm:mb-8 text-center px-2">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center justify-center gap-3 mb-3 sm:mb-4"
                        >
                            <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                            <span className="text-xs tracking-[0.3em] font-bold text-white/50">REFLECT OS</span>
                            <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                        </motion.div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-light text-white tracking-tight mb-2 sm:mb-3">
                            {title}
                        </h1>

                        {description && (
                            <p className="text-xs sm:text-sm md:text-base text-white/40 max-w-[300px] mx-auto leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Content Card */}
                    <div className="w-full">
                        <NeuralSurface
                            variant="glass"
                            className="w-full p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-2xl shadow-2xl flex flex-col gap-6"
                        >
                            {/* Progress Bar (Visible if progress > 0) */}
                            {progress > 0 && (
                                <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full bg-white shadow-[0_0_10px_white]"
                                    />
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={phase}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="w-full"
                                >
                                    {children}
                                </motion.div>
                            </AnimatePresence>
                        </NeuralSurface>
                    </div>
                </motion.div>
            </div>

            {/* Matrix Metadata (HUD feel) - hidden on mobile */}
            <div className="fixed bottom-4 left-4 sm:bottom-8 sm:left-8 hidden sm:flex flex-col gap-1 opacity-20 pointer-events-none z-20 text-[0.6rem]">
                <span className="font-black text-white tracking-[0.3em]">NODE // GATEWAY</span>
                <span className="text-white/50 text-[0.5rem]">STABLE_CONNECTION // {new Date().getFullYear()}</span>
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </main>
    );
};
