'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';

import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';
import { MobileDashboard } from './MobileDashboard';
import { IntelligenceDashboard } from './IntelligenceDashboard';
import { SettingsPanel } from './SettingsPanel';
import { CinematicBackground } from '@/components/ui/CinematicBackground';
import { LiquidGlass } from '@/components/ui/LiquidGlass';

type Tab = 'home' | 'intelligence' | 'explorer' | 'settings';

export const MatrixDesktop: React.FC = () => {
    const { username, logout } = useAuth();

    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Top App Bar state
    const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
    const [tunnelActive, setTunnelActive] = useState(false);
    const [tunnelCopied, setTunnelCopied] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(15000);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchTunnel = useCallback(async () => {
        try {
            const res = await fetch('/api/tunnel', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setTunnelUrl(data.url);
                setTunnelActive(data.active);
            }
        } catch { }
    }, []);

    useEffect(() => {
        fetchTunnel();
        const timer = setInterval(fetchTunnel, refreshInterval);
        return () => clearInterval(timer);
    }, [fetchTunnel, refreshInterval]);

    const handleCopyTunnel = async () => {
        if (!tunnelUrl) return;
        try {
            await navigator.clipboard.writeText(tunnelUrl);
            setTunnelCopied(true);
            setTimeout(() => setTunnelCopied(false), 2000);
        } catch { }
    };

    const handleRefresh = () => {
        fetchTunnel();
        setRefreshTrigger(prev => prev + 1); // This can be passed to MobileDashboard if needed, but MobileDashboard has its own polling.
        // Actually since MobileDashboard has its own polling, maybe it is fine.
        // Let's just force a window reload for hard refresh
        window.location.reload();
    };

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    // When clicking a tab that opens a modal/overlay (like settings or intelligence),
    // we either render it over the content OR change the active pane.
    // For Intelligence, we can render `IntelligenceDashboard` when activeTab === 'intelligence'
    // For Settings, it's better as an overlay.

    const handleTabChange = (tab: Tab) => {
        if (tab === 'settings') {
            setIsSettingsOpen(true);
            // Don't change actual tab so it acts as an overlay
            return;
        }
        if (tab === 'explorer') {
            window.location.href = '/dashboard/explorer';
            return;
        }
        setActiveTab(tab);
    };

    return (
        <div className="matrix-desktop h-screen w-screen bg-[#04040c] text-foreground overflow-hidden relative flex flex-col">
            <CinematicBackground />
            <div className="absolute inset-0 citadel-mesh pointer-events-none z-0" />
            <div className="absolute inset-0 citadel-grid opacity-30 pointer-events-none z-0" />

            <TopAppBar
                onOpenSettings={() => setIsSettingsOpen(true)}
                onRefresh={handleRefresh}
                tunnelActive={tunnelActive}
                tunnelUrl={tunnelUrl}
            />

            <main
                className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden"
                style={{
                    paddingTop: 'max(4.5rem, calc(env(safe-area-inset-top) + 3.5rem))',
                    paddingBottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))'
                }}
            >
                <div className="px-3 pb-4">
                    <LiquidGlass className="rounded-[28px] border-gold-500/15 min-h-[78vh] overflow-hidden">
                        <AnimatePresence mode="wait">
                            {activeTab === 'home' && (
                                <MobileDashboard key="home" />
                            )}
                            {activeTab === 'intelligence' && (
                                <IntelligenceDashboard
                                    key="intelligence"
                                    isOpen={true}
                                    onClose={() => setActiveTab('home')}
                                />
                            )}
                        </AnimatePresence>
                    </LiquidGlass>
                </div>
            </main>

            <BottomNavBar
                activeTab={activeTab === 'intelligence' ? 'intelligence' : 'home'}
                onTabChange={handleTabChange as any}
            />

            {isSettingsOpen && (
                <SettingsPanel
                    refreshInterval={refreshInterval}
                    onRefreshChange={setRefreshInterval}
                    username={username || null}
                    tunnelUrl={tunnelUrl}
                    tunnelActive={tunnelActive}
                    onCopyTunnel={handleCopyTunnel}
                    tunnelCopied={tunnelCopied}
                    onClose={() => setIsSettingsOpen(false)}
                    onLogout={handleLogout}
                />
            )}
        </div>
    );
};
