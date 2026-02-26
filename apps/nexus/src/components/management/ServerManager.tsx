'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, RefreshCcw, Skull, ShieldCheck, Zap, Square, Terminal as TerminalIcon, Cpu, Settings, Activity, LayoutDashboard, Ghost, Globe, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useTelemetry } from '@/components/providers/TelemetryProvider';

const ServiceNode = React.memo(({ name, status, icon: Icon, onStart, onStop, isProcessing }: {
    name: string,
    status: string,
    icon: React.ElementType,
    onStart: () => void,
    onStop: () => void,
    isProcessing: boolean
}) => (
    <div className="module-card p-4 flex flex-col gap-3 group/node relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] to-transparent opacity-0 group-hover/node:opacity-100 transition-opacity" />

        <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2 rounded-xl border transition-all duration-500",
                    status === 'online' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-rose-500/5 border-rose-500/10 text-rose-500/40"
                )}>
                    <Icon size={14} className={status === 'online' ? "animate-pulse" : ""} />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase tracking-widest leading-none mb-1">{name}</span>
                    <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm w-fit",
                        status === 'online' ? "bg-cyan-500/10 text-cyan-400" : "bg-rose-500/10 text-rose-500"
                    )}>
                        {status.toUpperCase()}
                    </span>
                </div>
            </div>
            <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-700",
                status === 'online' ? "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]" : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
            )} />
        </div>

        <div className="flex gap-2 relative z-10 mt-2">
            <button type="button"
                onClick={onStart}
                disabled={isProcessing || status === 'online'}
                className="flex-1 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-cyan-500/20 text-cyan-500/40 hover:text-cyan-400 border border-white/5 transition-all disabled:opacity-30"
            >
                <Power size={12} />
            </button>
            <button type="button"
                onClick={onStop}
                disabled={isProcessing || status === 'offline'}
                className="flex-1 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-500/40 hover:text-rose-400 border border-white/5 transition-all disabled:opacity-30"
            >
                <Square size={12} />
            </button>
        </div>
    </div>
));

ServiceNode.displayName = 'ServiceNode';

const ControlButton = React.memo(({ label, icon: Icon, action, variant = 'default', onConfirm }: {
    label: string, icon: any, action: string, variant?: 'default' | 'danger' | 'warning', onConfirm: (action: string) => void
}) => (
    <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onConfirm(action)}
        className={cn(
            "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-500 group/btn relative overflow-hidden",
            variant === 'default' && "bg-white/[0.03] border-white/5 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30",
            variant === 'danger' && "bg-rose-500/5 border-rose-500/10 text-rose-500/70 hover:text-rose-400 hover:border-rose-500/30",
            variant === 'warning' && "bg-amber-500/5 border-amber-500/10 text-amber-500/70 hover:text-amber-400 hover:border-amber-500/30"
        )}
    >
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 group-hover/btn:border-current transition-colors">
            <Icon size={16} />
        </div>
        <div className="flex flex-col items-start">
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
            <span className="text-xs font-mono opacity-30 group-hover/btn:opacity-60 transition-opacity">AUTH_REQUIRED::SYS_0x{action.substring(0, 2).toUpperCase()}</span>
        </div>
        <div className="ml-auto opacity-0 group-hover/btn:opacity-100 transition-opacity">
            <Zap size={10} className="text-cyan-400 animate-pulse" />
        </div>
    </motion.button>
));

ControlButton.displayName = 'ControlButton';

export function ServerManager() {
    const { services, setServiceStatus, refreshTelemetry } = useTelemetry();
    const [confirmAction, setConfirmAction] = React.useState<string | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const [systemId, setSystemId] = React.useState('');
    const actionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        setMounted(true);
        const storedId = localStorage.getItem('nexus_system_id') || Math.floor(Math.random() * 9999).toString(16).toUpperCase();
        localStorage.setItem('nexus_system_id', storedId);
        setSystemId(storedId);
        return () => {
            if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
        };
    }, []);

    const handleSystemAction = async (action: string) => {
        setIsProcessing(true);
        if (action === 'sync') {
            await refreshTelemetry();
            setIsProcessing(false);
            setConfirmAction(null);
            return;
        }

        const targetServices = ['reflect', 'ghost', 'rocket', 'nexus', 'gate'];
        if (action.includes('ignite') || action.includes('restart')) {
            targetServices.forEach(s => setServiceStatus(s as any, 'connecting'));
        } else if (action.includes('kill') || action.includes('purge')) {
            targetServices.forEach(s => setServiceStatus(s as any, 'offline'));
        }

        try {
            await supabase.from('ghost_bridge').insert([{
                command: `sys:${action}`,
                source: 'nexus_fusion_core',
                status: 'pending'
            }]);

            actionTimeoutRef.current = setTimeout(async () => {
                await refreshTelemetry();
                setIsProcessing(false);
                setConfirmAction(null);
            }, 2500);
        } catch (err) {
            console.error(`System action ${action} failed:`, err);
            setIsProcessing(false);
        }
    };

    const actions = [
        { id: 'deep_ignite', label: 'Ignition Sequence', icon: Power, variant: 'default' as const, desc: 'Engage sequential startup of all core neural nodes.' },
        { id: 'restart_all', label: 'Soft Reboot', icon: RefreshCcw, variant: 'default' as const, desc: 'Flush process caches and re-ignite non-critical threads.' },
        { id: 'sync', label: 'Pulse Sync', icon: Zap, variant: 'warning' as const, desc: 'Real-time telemetry alignment across the bridge.' },
        { id: 'kill_all', label: 'Emergency Kill', icon: Skull, variant: 'danger' as const, desc: 'Immediate termination of all local headless processes.' }
    ];

    return (
        <div className="space-y-8 relative">
            {/* Header: Fusion Core Status */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                            <Activity className="text-cyan-400 animate-pulse" size={20} />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-[#050505] shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                    </div>
                    <div>
                        <h3 className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic mb-1.5">Fusion Core Prime</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] italic opacity-60">Control Matrix // SID {systemId}</p>
                    </div>
                </div>
            </div>

            {/* Confirmation Overlay */}
            <AnimatePresence>
                {confirmAction && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        className="absolute inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-8 rounded-[28px] border border-white/5"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#050505] border border-white/10 p-8 rounded-[24px] shadow-2xl max-w-xs w-full text-center space-y-6"
                        >
                            <div className="flex justify-center">
                                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                                    <ShieldCheck size={32} className="text-rose-500" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-2 italic">Neural Auth Required</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed italic">
                                    {actions.find(a => a.id === confirmAction)?.desc}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button"
                                    onClick={() => setConfirmAction(null)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
                                >
                                    ABORT
                                </button>
                                <button type="button"
                                    onClick={() => handleSystemAction(confirmAction)}
                                    disabled={isProcessing}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl text-black text-[9px] font-black uppercase tracking-widest transition-all",
                                        isProcessing ? "bg-violet-400" : actions.find(a => a.id === confirmAction)?.variant === 'danger' ? 'bg-rose-500' : 'bg-cyan-400'
                                    )}
                                >
                                    {isProcessing ? 'WAIT...' : 'EXECUTE'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actions.map(action => (
                    <ControlButton
                        key={action.id}
                        {...action}
                        action={action.id}
                        onConfirm={setConfirmAction}
                    />
                ))}
            </div>

            {/* Service Matrix */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-slate-600">Node Registry</span>
                    <div className="h-px flex-1 mx-4 bg-white/5" />
                    <span className="text-[10px] font-mono text-slate-700">GRP_01</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(services).map(([name, status]) => {
                        const icons: Record<string, any> = {
                            nexus: LayoutDashboard,
                            ghost: Ghost,
                            rocket: Zap,
                            reflect: Activity,
                            gate: Globe,
                            dashboard: Activity,
                            proxy: Globe
                        };
                        return (
                            <ServiceNode
                                key={name}
                                name={name}
                                status={status}
                                icon={icons[name] || TerminalIcon}
                                onStart={() => handleSystemAction(`start_${name}`)}
                                onStop={() => handleSystemAction(`stop_${name}`)}
                                isProcessing={isProcessing}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
