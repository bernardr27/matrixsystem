'use client';

import React, { useState, useEffect } from 'react';
import { Scan, Smartphone, Monitor, Tablet, X, MousePointerClick, Type, Move, Target, Activity } from 'lucide-react';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { cn } from '@/lib/utils';

export function UIDebugger({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
    const [internalActive, setInternalActive] = useState(false);
    const active = isOpen !== undefined ? isOpen : internalActive;
    const setActive = React.useMemo(
        () => (onClose ? (val: boolean) => !val && onClose() : setInternalActive),
        [onClose]
    );

    const [mode, setMode] = useState<'off' | 'outlines' | 'overflow' | 'touch' | 'text'>('off');
    const [resolution, setResolution] = useState<'full' | 'mobile' | 'tablet'>('full');
    const [ralphDefects, setRalphDefects] = useState<any[]>([]);
    const [isRalphAuditing, setIsRalphAuditing] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const panelRef = React.useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (active && panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setActive(false);
            }
        };

        if (active) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [active, setActive]);

    useEffect(() => {
        // Clear all debug classes first
        document.body.classList.remove('debug-outlines', 'debug-overflow', 'debug-touch', 'debug-text');
        clearHighlights();

        if (mode === 'outlines') {
            document.body.classList.add('debug-outlines');
        } else if (mode === 'overflow') {
            document.body.classList.add('debug-overflow');
            checkOverflow();
        } else if (mode === 'touch') {
            document.body.classList.add('debug-touch');
            checkTouchTargets();
        } else if (mode === 'text') {
            document.body.classList.add('debug-text');
            checkTextSizes();
        }
    }, [mode]);

    // Reset resolution when closing
    useEffect(() => {
        if (!isOpen) {
            setResolution('full');
        }
    }, [isOpen]);

    useEffect(() => {
        const root = document.getElementById('matrix-root');
        if (!root) return;

        // Safety check: Don't force a width larger than the actual window
        const windowWidth = window.innerWidth;

        if (resolution === 'mobile') {
            root.style.maxWidth = '375px';
            root.style.margin = '0 auto';
            root.style.border = '1px solid cyan';
            root.style.height = '812px';
            root.style.position = 'relative';
            root.style.overflow = 'hidden';
        } else if (resolution === 'tablet') {
            if (windowWidth < 768) {
                // If screen is smaller than tablet, don't force tablet width (it breaks UI)
                setResolution('full');
                return;
            }
            root.style.maxWidth = '768px';
            root.style.margin = '0 auto';
            root.style.border = '1px solid cyan';
            root.style.height = '1024px';
            root.style.position = 'relative';
            root.style.overflow = 'hidden';
        } else {
            root.style.maxWidth = '';
            root.style.margin = '';
            root.style.border = '';
            root.style.height = '100vh';
            root.style.position = '';
            root.style.overflow = '';
        }

        // Cleanup function to reset styles when component unmounts or changes
        return () => {
            // We don't necessarily want to reset on every render, but definitely on unmount.
            // Rely on the 'full' state to clear styles.
        };
    }, [resolution, isOpen]);

    const checkOverflow = () => {
        const docWidth = document.documentElement.offsetWidth;
        let count = 0;
        document.querySelectorAll('*').forEach(el => {
            if ((el as HTMLElement).offsetWidth > docWidth) {
                (el as HTMLElement).style.outline = '2px solid red';
                (el as HTMLElement).setAttribute('data-debug-error', 'Overflow');
                count += 1;
            }
        });
        return count;
    };

    const checkTouchTargets = () => {
        let count = 0;
        document.querySelectorAll('button, a, input, [role="button"]').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                (el as HTMLElement).style.outline = '2px solid #ff00ff'; // Magenta for small targets
                (el as HTMLElement).style.position = 'relative';
                count += 1;
            }
        });
        return count;
    };

    const checkTextSizes = () => {
        let count = 0;
        document.querySelectorAll('*').forEach(el => {
            // Only check leaf nodes or text containers
            if (el.children.length === 0 && el.textContent?.trim().length) {
                const style = window.getComputedStyle(el);
                const fontSize = parseFloat(style.fontSize);
                if (fontSize < 12) {
                    (el as HTMLElement).style.outline = '1px solid yellow';
                    count += 1;
                }
            }
        });
        return count;
    };

    const clearHighlights = () => {
        document.querySelectorAll('*').forEach(el => {
            (el as HTMLElement).style.outline = '';
            (el as HTMLElement).removeAttribute('data-debug-error');
        });
        setRalphDefects([]);
    };

    const runRalphAudit = async () => {
        if (isRalphAuditing) return;
        setIsRalphAuditing(true);
        clearHighlights();

        try {
            const res = await fetch('/api/ralph/fix', {
                method: 'POST',
                body: JSON.stringify({ action: 'audit' })
            });
            const data = await res.json();
            if (data.success && data.data.output) {
                const output = data.data.output;
                const defectLines = output.split('DEFECTS (')[1]?.split('):')[1]?.split('\n\n')[0].split('\n').filter(Boolean) || [];
                setRalphDefects(defectLines.map((d: string) => ({ description: d, severity: 'warn' })));
            }
        } catch (err) {
            console.error('Ralph audit failed:', err);
        } finally {
            setIsRalphAuditing(false);
        }
    };

    const runRalphSimulation = async () => {
        if (isSimulating) return;
        setIsSimulating(true);
        clearHighlights();

        try {
            const res = await fetch('/api/ralph/fix', {
                method: 'POST',
                body: JSON.stringify({ action: 'simulate' })
            });
            const data = await res.json();
            if (data.success && data.data.output) {
                const output = data.data.output;
                const status = output.includes('VALID') ? 'VALID' : 'INVALID';
                const shadowFile = output.split('Shadow: ')[1]?.split('\n')[0] || 'Unknown';
                setRalphDefects([{ description: `Simulation: ${status} | File: ${shadowFile}`, severity: status === 'VALID' ? 'info' : 'crit' }]);
            }
        } catch (err) {
            console.error('Ralph simulation failed:', err);
        } finally {
            setIsSimulating(false);
        }
    };

    const runRalphPurge = async () => {
        try {
            await fetch('/api/ralph/fix', {
                method: 'POST',
                body: JSON.stringify({ action: 'purge' })
            });
            clearHighlights();
        } catch (err) {
            console.error('Ralph purge failed:', err);
        }
    };

    const runAudit = async () => {
        clearHighlights();
        checkOverflow();
        checkTouchTargets();
        checkTextSizes();
        // Legacy audit summary removed in favor of Ralph AI Guard
    };

    const copyAudit = async () => {
        if (ralphDefects.length === 0) return;
        const payload = {
            app: 'ghost-command',
            viewport: resolution,
            defects: ralphDefects
        };
        try {
            await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        } catch {
            // Ignore
        }
    };

    if (!active) {
        // If controlled externally, don't show the floating button
        if (isOpen !== undefined) return null;

        return (
            <button type="button"
                onClick={() => setActive(true)}
                className="fixed bottom-24 right-4 z-[9999] p-3 bg-black/80 border border-cyan-500/30 rounded-full text-cyan-400 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20 transition-all shadow-lg shadow-cyan-500/10"
                title="Open UI Debugger"
            >
                <Scan size={20} />
            </button>
        );
    }

    return (
        <div ref={panelRef} className="fixed bottom-4 right-4 z-[9999]">
            <NeuralSurface className="p-4 w-72 space-y-4 bg-black/95 border-cyan-500/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <Activity size={12} />
                        UI Debugger
                    </h3>
                    <button type="button" onClick={() => setActive(false)} className="text-white/40 hover:text-white">
                        <X size={14} />
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Analysis Mode</div>
                    <div className="grid grid-cols-2 gap-2">
                        <DebugToggle
                            active={mode === 'outlines'}
                            onClick={() => setMode(mode === 'outlines' ? 'off' : 'outlines')}
                            icon={Move} label="Layout"
                        />
                        <DebugToggle
                            active={mode === 'overflow'}
                            onClick={() => setMode(mode === 'overflow' ? 'off' : 'overflow')}
                            icon={Target} label="Overflow"
                        />
                        <DebugToggle
                            active={mode === 'touch'}
                            onClick={() => setMode(mode === 'touch' ? 'off' : 'touch')}
                            icon={MousePointerClick} label="Touch Targets"
                        />
                        <DebugToggle
                            active={mode === 'text'}
                            onClick={() => setMode(mode === 'text' ? 'off' : 'text')}
                            icon={Type} label="Text Size"
                        />
                    </div>
                    <div className="text-[8px] text-white/30 italic mt-1 h-4">
                        {mode === 'off' && "Select a tool to analyze UI"}
                        {mode === 'outlines' && "Visualizing DOM boundaries (Cyan)"}
                        {mode === 'overflow' && "Highlighting horizontal overflow (Red)"}
                        {mode === 'touch' && "Highlighting small touch targets < 44px (Magenta)"}
                        {mode === 'text' && "Highlighting small text < 12px (Yellow)"}
                    </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Viewport Simulation</div>
                    <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                        <ViewportBtn active={resolution === 'full'} onClick={() => setResolution('full')} icon={Monitor} title="Desktop" />
                        <ViewportBtn active={resolution === 'tablet'} onClick={() => setResolution('tablet')} icon={Tablet} title="Tablet" />
                        <ViewportBtn active={resolution === 'mobile'} onClick={() => setResolution('mobile')} icon={Smartphone} title="Mobile" />
                    </div>
                    <div className="text-[8px] text-white/30 text-center">
                        {resolution === 'full' ? 'Native Resolution' : resolution === 'tablet' ? 'Tablet (768x1024)' : 'Mobile (375x812)'}
                    </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">AI Guard Audit</div>
                    <div className="grid grid-cols-1 gap-2">
                        <button type="button"
                            onClick={runRalphAudit}
                            disabled={isRalphAuditing}
                            className={cn(
                                "px-2 py-2 rounded border text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                isRalphAuditing
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 cursor-not-allowed"
                                    : "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                            )}
                        >
                            <Scan size={14} className={isRalphAuditing ? "animate-spin" : ""} />
                            {isRalphAuditing ? "Scanning..." : "Run AI Visual Audit"}
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button"
                                onClick={runRalphSimulation}
                                disabled={isSimulating}
                                className={cn(
                                    "px-2 py-2 rounded border text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                    isSimulating
                                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 cursor-not-allowed"
                                        : "border-cyan-500/40 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10"
                                )}
                            >
                                <Activity size={14} className={isSimulating ? "animate-spin" : ""} />
                                {isSimulating ? "Simulating..." : "Scan & Simulate"}
                            </button>
                            <button type="button"
                                onClick={runRalphPurge}
                                className="px-2 py-2 rounded border border-red-500/40 bg-red-500/5 text-red-400 text-[9px] font-bold uppercase hover:bg-red-500/10 transition-all"
                            >
                                Purge Shadows
                            </button>
                        </div>
                    </div>
                    {ralphDefects.length > 0 && (
                        <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                            {ralphDefects.map((d, i) => (
                                <div key={i} className="p-1 px-2 rounded bg-red-500/10 border border-red-500/20 text-[8px] text-red-300">
                                    {d.description}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <style jsx global>{`
                    .debug-outlines * {
                        outline: 1px solid rgba(0, 255, 255, 0.15) !important;
                    }
                `}</style>
            </NeuralSurface>

            {/* Visual Overlays for Ralph Defects */}
            {ralphDefects.map((d, i) => d.bbox && (
                <div
                    key={`overlay-${i}`}
                    className="fixed pointer-events-none border-2 border-red-500 bg-red-500/10 z-[10000] flex items-start justify-center"
                    style={{
                        left: d.bbox[0],
                        top: d.bbox[1],
                        width: d.bbox[2],
                        height: d.bbox[3]
                    }}
                >
                    <span className="bg-red-500 text-white text-[8px] font-bold px-1 rounded-b whitespace-nowrap">
                        {d.severity.toUpperCase()} DEFECT
                    </span>
                </div>
            ))}
        </div>
    );
}

function DebugToggle({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button type="button"
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-2 py-2 rounded border transition-all duration-200",
                active
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                    : "bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white"
            )}
        >
            <Icon size={12} />
            <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
        </button>
    );
}

function ViewportBtn({ active, onClick, icon: Icon, title }: { active: boolean, onClick: () => void, icon: any, title?: string }) {
    return (
        <button type="button"
            onClick={onClick}
            className={cn(
                "flex-1 flex items-center justify-center py-2 rounded transition-all",
                active
                    ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                    : "text-white/30 hover:bg-white/10 hover:text-white"
            )}
        >
            <Icon size={14} />
        </button>
    );
}
