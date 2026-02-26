'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Search, LayoutDashboard, MessageSquare, Target, Terminal,
    Radio, Monitor, Settings, Zap, ArrowRight, Command, CornerDownLeft,
    ArrowUp, ArrowDown, Moon, Sun, RotateCcw, Wifi, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   COMMAND PALETTE v1.0 — Ctrl+K spotlight search
   Navigate pages, run actions, search commands
   ═══════════════════════════════════════════════════════ */

interface PaletteItem {
    id: string;
    label: string;
    description?: string;
    icon: React.ElementType;
    category: 'navigation' | 'action' | 'shortcut';
    action: () => void;
    keywords?: string[];
}

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    const navigate = useCallback((href: string) => {
        setOpen(false);
        setQuery('');
        if (pathname !== href) router.push(href);
    }, [pathname, router]);

    const items: PaletteItem[] = useMemo(() => [
        // Navigation
        { id: 'nav-hub', label: 'Go to Hub', description: 'Operator Hub dashboard', icon: LayoutDashboard, category: 'navigation', action: () => navigate('/'), keywords: ['home', 'dashboard', 'launch', 'operator'] },
        { id: 'nav-chat', label: 'Go to Chat', description: 'Antigravity AI chat', icon: MessageSquare, category: 'navigation', action: () => navigate('/chat'), keywords: ['ai', 'antigravity', 'ghost', 'nexus', 'message'] },
        { id: 'nav-missions', label: 'Go to Missions', description: 'Mission Control center', icon: Target, category: 'navigation', action: () => navigate('/mission-control'), keywords: ['mission', 'control', 'tasks'] },
        { id: 'nav-ops', label: 'Go to Operations', description: 'Operations terminal', icon: Terminal, category: 'navigation', action: () => navigate('/operations'), keywords: ['ops', 'terminal', 'command'] },
        { id: 'nav-telemetry', label: 'Go to Telemetry', description: 'Telemetry deck', icon: Radio, category: 'navigation', action: () => navigate('/telemetry'), keywords: ['telem', 'metrics', 'data', 'signals'] },
        { id: 'nav-remote', label: 'Go to Remote', description: 'Remote desktop control', icon: Monitor, category: 'navigation', action: () => navigate('/remote-desktop'), keywords: ['remote', 'desktop', 'screen'] },
        { id: 'nav-settings', label: 'Go to Settings', description: 'App configuration', icon: Settings, category: 'navigation', action: () => navigate('/settings'), keywords: ['config', 'preferences', 'options'] },

        // Actions
        { id: 'action-reload', label: 'Reload Page', description: 'Hard refresh current page', icon: RotateCcw, category: 'action', action: () => { setOpen(false); window.location.reload(); }, keywords: ['refresh', 'reload', 'reset'] },
        { id: 'action-health', label: 'Check Health', description: 'Ping service health endpoint', icon: Activity, category: 'action', action: () => { setOpen(false); fetch('/api/services').then(() => window.location.reload()); }, keywords: ['health', 'ping', 'status'] },

        // Shortcuts info
        { id: 'shortcut-1', label: 'Keyboard: 1–7', description: 'Navigate to pages (Hub, Chat, Missions, etc.)', icon: Command, category: 'shortcut', action: () => {}, keywords: ['keyboard', 'shortcut', 'number'] },
        { id: 'shortcut-k', label: 'Keyboard: Ctrl+K', description: 'Open this command palette', icon: Search, category: 'shortcut', action: () => {}, keywords: ['keyboard', 'shortcut', 'search', 'palette'] },
    ], [navigate]);

    const filtered = useMemo(() => {
        if (!query.trim()) return items;
        const q = query.toLowerCase();
        return items.filter(item =>
            item.label.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.keywords?.some(k => k.includes(q))
        );
    }, [query, items]);

    // Group by category
    const grouped = useMemo(() => {
        const cats: Record<string, PaletteItem[]> = {};
        for (const item of filtered) {
            if (!cats[item.category]) cats[item.category] = [];
            cats[item.category].push(item);
        }
        return cats;
    }, [filtered]);

    const flatFiltered = useMemo(() => filtered, [filtered]);

    // Global Ctrl+K listener
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
                setQuery('');
                setSelectedIndex(0);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation inside palette
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, flatFiltered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatFiltered[selectedIndex]) {
                flatFiltered[selectedIndex].action();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            setQuery('');
        }
    }, [flatFiltered, selectedIndex]);

    // Scroll selected into view
    useEffect(() => {
        if (!listRef.current) return;
        const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    if (!open) return null;

    const categoryLabels: Record<string, string> = {
        navigation: 'Navigate',
        action: 'Actions',
        shortcut: 'Shortcuts',
    };

    let flatIndex = -1;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" onClick={() => { setOpen(false); setQuery(''); }}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Palette */}
            <div
                className="relative w-full max-w-[520px] mx-4 bg-[#0a0a1a]/95 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                    <Search className="w-4 h-4 text-white/30 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search commands..."
                        className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/20 outline-none font-mono"
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] text-white/25 font-mono">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
                    {flatFiltered.length === 0 ? (
                        <div className="px-4 py-8 text-center text-white/20 text-sm">
                            No commands found
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, categoryItems]) => (
                            <div key={category}>
                                <div className="px-4 pt-2 pb-1 text-[10px] font-mono text-white/20 tracking-wider uppercase">
                                    {categoryLabels[category] || category}
                                </div>
                                {categoryItems.map(item => {
                                    flatIndex++;
                                    const idx = flatIndex;
                                    const Icon = item.icon;
                                    const isSelected = idx === selectedIndex;
                                    return (
                                        <button
                                            key={item.id}
                                            data-index={idx}
                                            onClick={() => item.action()}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                                isSelected
                                                    ? 'bg-orange-500/10 text-orange-400'
                                                    : 'text-white/60 hover:bg-white/[0.03]'
                                            )}
                                        >
                                            <Icon className={cn('w-4 h-4 shrink-0', isSelected ? 'text-orange-400/70' : 'text-white/25')} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{item.label}</div>
                                                {item.description && (
                                                    <div className="text-[11px] text-white/20 truncate">{item.description}</div>
                                                )}
                                            </div>
                                            {item.category === 'navigation' && isSelected && (
                                                <ArrowRight className="w-3.5 h-3.5 text-orange-400/40 shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer hints */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06] text-[10px] text-white/15 font-mono">
                    <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> navigate</span>
                    <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> select</span>
                    <span className="flex items-center gap-1">esc close</span>
                </div>
            </div>
        </div>
    );
}
