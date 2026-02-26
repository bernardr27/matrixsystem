'use client';

import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SystemDock } from './SystemDock';
import { DesktopWindow } from './DesktopWindow';
import { MenuBar } from './MenuBar';
import { AppDrawer } from './AppDrawer';
import { IntelligenceDashboard } from './IntelligenceDashboard';

interface WindowState {
    id: string;
    title: string;
    url: string;
    isOpen: boolean;
    isMinimized: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
}

export const MatrixDesktop: React.FC = () => {
    const [windows, setWindows] = useState<WindowState[]>([]);
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);

    const handleLaunch = useCallback((appId: string, title: string, url: string) => {
        const existing = windows.find(w => w.id === appId);
        if (existing) {
            if (existing.isMinimized) {
                setWindows(prev => prev.map(w => w.id === appId ? { ...w, isMinimized: false } : w));
            }
            setFocusedId(appId);
            return;
        }

        const windowCount = windows.length;
        const offsetX = 80 + (windowCount * 40) % 300;
        const offsetY = 100 + (windowCount * 40) % 200;

        const newWindow: WindowState = {
            id: appId,
            title,
            url,
            isOpen: true,
            isMinimized: false,
            position: { x: offsetX, y: offsetY },
            size: { width: 900, height: 600 }
        };

        setWindows(prev => [...prev, newWindow]);
        setFocusedId(appId);
    }, [windows]);

    const handleClose = (id: string) => {
        setWindows(prev => prev.filter(w => w.id !== id));
        if (focusedId === id) setFocusedId(null);
    };

    const handleMinimize = (id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
        if (focusedId === id) setFocusedId(null);
    };

    const handleRestore = (id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false } : w));
        setFocusedId(id);
    };

    const handleUpdatePosition = (id: string, x: number, y: number) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, position: { x, y } } : w
        ));
    };

    const handleUpdateSize = (id: string, width: number, height: number) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, size: { width, height } } : w
        ));
    };

    const activeIds = windows.filter(w => !w.isMinimized).map(w => w.id);
    const minimizedCount = windows.filter(w => w.isMinimized).length;

    return (
        <div className="matrix-desktop h-screen w-screen bg-background text-foreground overflow-hidden relative">
            {/* Cosmic Background */}
            <div className="absolute inset-0 cosmic-void opacity-100" />
            <div className="absolute inset-0 cosmic-grid opacity-30 mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />

            {/* Menu Bar */}
            <MenuBar minimizedCount={minimizedCount} onOpenDrawer={() => setIsDrawerOpen(true)} />

            {/* Main Workspace - Properly positioned below menu bar with safe areas */}
            <main
                className="fixed overflow-auto bg-transparent z-10"
                style={{
                    top: 'calc(var(--app-safe-top) + 3rem)',
                    bottom: 'calc(var(--app-safe-bottom) + 6.5rem)',
                    left: 'max(0px, env(safe-area-inset-left))',
                    right: 'max(0px, env(safe-area-inset-right))',
                }}
            >
                <AnimatePresence>
                    {windows.map((win) => (
                        !win.isMinimized && (
                            <DesktopWindow
                                key={win.id}
                                {...win}
                                isFocused={focusedId === win.id}
                                onFocus={() => setFocusedId(win.id)}
                                onClose={() => handleClose(win.id)}
                                onMinimize={() => handleMinimize(win.id)}
                                onUpdatePosition={handleUpdatePosition}
                                onUpdateSize={handleUpdateSize}
                            />
                        )
                    ))}
                </AnimatePresence>
            </main>

            {/* Intelligence Dashboard */}
            <IntelligenceDashboard
                isOpen={isIntelligenceOpen}
                onClose={() => setIsIntelligenceOpen(false)}
            />

            {/* Dock */}
            <SystemDock
                activeWindows={activeIds}
                minimizedWindows={windows.filter(w => w.isMinimized).map(w => ({ id: w.id, title: w.title }))}
                onLaunch={handleLaunch}
                onRestore={handleRestore}
                onOpenIntelligence={() => setIsIntelligenceOpen(true)}
                focusedId={focusedId}
            />

            {/* App Management Drawer Overlay */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-[100] animate-fade-in">
                    <AppDrawer onClose={() => setIsDrawerOpen(false)} />
                </div>
            )}
        </div>
    );
};
