'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Maximize2, ChevronDown } from 'lucide-react';
import { cn } from '@matrix-lib/utils';

interface DesktopWindowProps {
    id: string;
    title: string;
    url: string;
    isOpen: boolean;
    isFocused: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
    onClose: () => void;
    onFocus: () => void;
    onMinimize: () => void;
    onUpdatePosition: (id: string, x: number, y: number) => void;
    onUpdateSize: (id: string, width: number, height: number) => void;
}

export const DesktopWindow: React.FC<DesktopWindowProps> = ({
    id,
    title,
    url,
    isOpen,
    isFocused,
    position,
    size,
    onClose,
    onFocus,
    onMinimize,
    onUpdatePosition,
    onUpdateSize,
}) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);

    // Timeout to detect failed iframe loads (like Tailscale Funnel port blocks)
    useEffect(() => {
        if (isOpen && isLoading) {
            const timer = setTimeout(() => {
                setLoadError(true);
            }, 8000); // 8 seconds timeout
            return () => clearTimeout(timer);
        }
    }, [isOpen, isLoading]);

    if (!isOpen) return null;

    // Viewport-aware responsive sizing
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const maxWidth = typeof window !== 'undefined' ? window.innerWidth - (isMobile ? 16 : 32) : 900;
    const maxHeight = typeof window !== 'undefined' ? window.innerHeight - (isMobile ? 200 : 200) : 600;

    const defaultWidth = isMobile ? maxWidth : 900;
    const defaultHeight = isMobile ? maxHeight : 600;

    // Ensure valid values for positioning and constrain to viewport max
    const safeX = typeof position.x === 'number' && isFinite(position.x) ? position.x : (isMobile ? 8 : 80);
    const safeY = typeof position.y === 'number' && isFinite(position.y) ? position.y : (isMobile ? 64 : 100);
    const safeWidth = typeof size.width === 'number' && isFinite(size.width) && size.width > 0 ? Math.min(size.width, defaultWidth) : defaultWidth;
    const safeHeight = typeof size.height === 'number' && isFinite(size.height) && size.height > 0 ? Math.min(size.height, defaultHeight) : defaultHeight;

    const windowStyle = isMaximized || (isMobile && safeWidth >= maxWidth - 20) ? {
        top: 48,
        left: 0,
        width: '100%',
        height: 'calc(100vh - 48px - 96px)',
    } : {
        top: Math.max(48, safeY),
        left: Math.max(0, safeX),
        width: Math.max(300, safeWidth),
        height: Math.max(200, safeHeight),
    };

    return (
        <motion.div
            ref={dragRef}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, zIndex: isFocused ? 50 : 10 }}
            exit={{ scale: 0.8, opacity: 0 }}
            drag={!isMaximized}
            dragMomentum={false}
            dragConstraints={{ left: 0, top: 96, right: 2000, bottom: 1500 }}
            onDrag={(e, info) => {
                const newX = Math.round(info.point.x);
                const newY = Math.round(info.point.y);
                if (isFinite(newX) && isFinite(newY)) {
                    onUpdatePosition(id, newX, newY);
                }
            }}
            style={windowStyle}
            className={cn(
                "fixed flex flex-col overflow-hidden transition-all duration-300 ease-out",
                isFocused
                    ? "glass-panel-gold rounded-[2rem] ring-1 ring-gold-500/30 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(212,168,67,0.25)] backdrop-blur-2xl"
                    : "glass-panel rounded-[2rem] opacity-80 backdrop-blur-2xl shadow-2xl"
            )}
        >
            {/* Title Bar */}
            <div
                className={cn(
                    "h-10 flex items-center justify-between px-4 border-b cursor-move select-none group transition-all duration-300",
                    isFocused
                        ? "bg-gradient-to-r from-gold-500/10 via-transparent to-transparent border-gold-500/20"
                        : "bg-white/5 border-white/5"
                )}
                onPointerDown={onFocus}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        isFocused ? "bg-gold-400 shadow-[0_0_8px_rgba(212,168,67,0.8)] animate-pulse-slow" : "bg-white/30"
                    )} />
                    <span className={cn(
                        "text-xs font-display font-semibold tracking-wider uppercase truncate",
                        isFocused ? "text-gold-100 drop-shadow-md" : "text-white/40"
                    )}>
                        {title}
                    </span>
                </div>

                {/* Window Controls - Always visible on mobile, hover on desktop */}
                <div className="flex items-center gap-2 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMinimize();
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-md transition-all text-white/40 hover:text-white"
                        title="Minimize"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMaximized(!isMaximized);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-md transition-all text-white/40 hover:text-white"
                        title={isMaximized ? 'Restore' : 'Maximize'}
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-1.5 hover:bg-red-500/20 rounded-md transition-all text-white/40 hover:text-red-400 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                        title="Close"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 bg-black/80 overflow-hidden relative flex items-center justify-center">
                {/* Loader showing before iframe loads */}
                {isLoading && !loadError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm z-0">
                        <div className="w-8 h-8 rounded-full border-2 border-gold-500/30 border-t-gold-400 animate-spin" />
                        <span className="text-[10px] uppercase tracking-widest text-gold-500/50 font-mono animate-pulse">Establishing Connection...</span>
                    </div>
                )}

                {/* Error state if iframe takes too long */}
                {isLoading && loadError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-md z-30 p-8 text-center">
                        <div className="w-12 h-12 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center justify-center mb-2">
                            <X className="w-5 h-5 text-red-400" />
                        </div>
                        <h3 className="text-sm font-display text-white tracking-widest uppercase mb-1">Connection Timeout</h3>
                        <p className="text-xs text-white/50 max-w-sm mb-4">
                            The application at <span className="text-gold-400 font-mono">{url}</span> failed to respond.
                        </p>
                        <div className="text-[10px] text-white/40 font-mono bg-white/5 p-4 rounded-lg text-left max-w-sm">
                            <strong className="text-white/70 block mb-2">Diagnostic Info:</strong>
                            If you are accessing Citadel remotely via a Tailscale Funnel (e.g., .ts.net domain), secondary ports like 3000 (Reflect) and 3001 (Nexus) are <strong>not proxied</strong> by the Funnel.
                            <br /><br />
                            <strong>Fix:</strong> Access Citadel using your machine's strict Tailscale IP (e.g. 100.x.x.x:3005) instead of the Funnel domain.
                        </div>
                        <button onClick={() => setLoadError(false)} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-xs text-white uppercase tracking-wider rounded-lg transition-colors">
                            Dismiss & Retry
                        </button>
                    </div>
                )}

                {/* Inner shadow for depth */}
                <div className="absolute inset-0 shadow-[inset_0_20px_40px_rgba(0,0,0,0.8)] pointer-events-none z-20" />
                <iframe
                    src={url}
                    onLoad={() => setIsLoading(false)}
                    className={cn("w-full h-full border-0 relative z-10 transition-opacity duration-500", isLoading ? "opacity-0" : "opacity-100")}
                    title={title}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
            </div>

            {/* Status Bar */}
            <div className={cn(
                "h-8 px-4 flex items-center justify-between text-[10px] font-mono border-t tracking-wider uppercase backdrop-blur-md",
                isFocused
                    ? "bg-black/40 border-gold-500/20 text-gold-500/60"
                    : "bg-black/20 border-white/5 text-white/20"
            )}>
                <div className="flex items-center gap-2">
                    <ChevronDown className="w-3 h-3 opacity-50" />
                    <span>
                        {isMaximized ? 'Maximized' : `${Math.round(size.width)} × ${Math.round(size.height)}`}
                    </span>
                </div>
                <span>
                    {id}
                </span>
            </div>
        </motion.div>
    );
};

