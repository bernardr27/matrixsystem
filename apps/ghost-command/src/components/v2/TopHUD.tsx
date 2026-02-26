'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Cpu, Database, Wifi, Shield,
    Volume2, VolumeX, HelpCircle, RefreshCw, Zap, Ghost, Bell, X
} from 'lucide-react';
import { useSage } from '@/context/SageContext';
import { useSynthesizer } from '@/hooks/useSynthesizer';
import { useSensory } from '@/hooks/useSensory';
import { cn } from '@/lib/utils';

export function TopHUD({ onShowGuide, onToggleDiag }: { onShowGuide: () => void, onToggleDiag: () => void }) {
    const { systemHealth, status, sendCommand } = useSage();
    const voice = useSynthesizer();
    const sensory = useSensory();
    const isAiThinking = status === 'thinking' || status === 'executing';
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [systemMenuOpen, setSystemMenuOpen] = useState(false);
    const systemMenuRef = useRef<HTMLDivElement>(null);
    const [notifications, setNotifications] = useState([
        { id: 1, message: 'System initialized', time: '1m ago', type: 'success' },
        { id: 2, message: 'Bridge sync completed', time: '3m ago', type: 'info' }
    ]);

    // Close system menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (systemMenuRef.current && !systemMenuRef.current.contains(e.target as Node)) {
                setSystemMenuOpen(false);
            }
        };
        if (systemMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [systemMenuOpen]);

    return (
        <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4"
        >
            <div className="w-full max-w-6xl flex items-center justify-between pointer-events-auto">

                {/* LEFT: IDENTITY */}
                <div className="flex items-center gap-3 bg-[#050505]/60 backdrop-blur-xl border border-white/5 rounded-full px-4 py-2 shadow-xl">
                    <div className="relative">
                        <Ghost size={16} className={cn(systemHealth.online ? "text-cyan-400" : "text-white/20")} />
                        {systemHealth.online && (
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgb(16,185,129)]" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white/90 leading-none">Phantom OS</span>
                        <span className={cn(
                            "text-[8px] font-medium",
                            systemHealth.online ? "text-emerald-500/50" : "text-white/30"
                        )}>
                            {systemHealth.online ? `ID: ${systemHealth.services?.runner || 'Online'}` : 'v4.2.0 Offline'}
                        </span>
                    </div>
                </div>

                {/* CENTER: TELEMETRY PILLS (HIDDEN ON MOBILE) */}
                <div className="hidden md:flex items-center gap-2 bg-[#050505]/40 backdrop-blur-md border border-white/5 rounded-full p-1.5 shadow-lg">
                    <TelemetryPill
                        label="CPU"
                        value={systemHealth.cpu || "0%"}
                        icon={<Cpu size={10} />}
                        active={systemHealth.online}
                    />
                    <div className="w-px h-3 bg-white/10" />
                    <TelemetryPill
                        label="RAM"
                        value={`${Math.round(Number(systemHealth.ram) || 0)}%`}
                        icon={<Database size={10} />}
                        active={systemHealth.online}
                    />
                    <div className="w-px h-3 bg-white/10" />
                    <TelemetryPill
                        label="Net"
                        value={systemHealth.online ? "Conn" : "Off"}
                        icon={<Wifi size={10} />}
                        active={systemHealth.online}
                        color={systemHealth.online ? "emerald" : "red"}
                    />
                    <div className="w-px h-3 bg-white/10" />
                    <TelemetryPill
                        label="AI"
                        value={status === 'executing' ? "Proc" : status === 'thinking' ? "Think" : "Idle"}
                        icon={<Zap size={10} />}
                        active={true}
                        pulse={isAiThinking}
                        color="violet"
                    />
                </div>

                {/* RIGHT: ACTIONS */}
                <div className="flex items-center gap-2 bg-[#050505]/60 backdrop-blur-xl border border-white/5 rounded-full px-3 py-2 shadow-xl">
                    {/* DIAG TOGGLE */}
                    <button type="button"
                        onClick={onToggleDiag}
                        className="p-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-2 px-3"
                    >
                        <Activity size={12} />
                        <span className="text-[9px] font-bold hidden sm:inline">Status</span>
                    </button>

                    <div className="w-px h-3 bg-white/10" />

                    <ActionButton
                        onClick={voice.toggle}
                        active={voice.enabled}
                        label={voice.enabled ? "Vocal" : "Mute"}
                        icon={voice.enabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                    />
                    <div className="w-px h-3 bg-white/10" />

                    {/* NOTIFICATION BELL */}
                    <div className="relative">
                        <button type="button"
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors relative"
                        >
                            <Bell size={14} />
                            {notifications.length > 0 && (
                                <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            )}
                        </button>

                        {/* NOTIFICATIONS DROPDOWN */}
                        <AnimatePresence>
                            {notificationsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    className="absolute top-10 right-0 w-56 bg-[#050505]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[100]"
                                >
                                    <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                                        <span className="text-[9px] font-bold text-white/40 uppercase">Notifications</span>
                                        <button type="button"
                                            onClick={() => setNotificationsOpen(false)}
                                            className="p-0.5 hover:bg-white/10 rounded transition-colors"
                                        >
                                            <X size={12} className="text-white/40" />
                                        </button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-3 py-6 text-center text-[9px] text-white/20">
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <NotificationItem
                                                    key={notif.id}
                                                    message={notif.message}
                                                    time={notif.time}
                                                    type={notif.type as 'success' | 'info' | 'warning'}
                                                    onDismiss={() => setNotifications(notifications.filter(n => n.id !== notif.id))}
                                                />
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-px h-3 bg-white/10" />
                    <button type="button"
                        onClick={onShowGuide}
                        className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    >
                        <HelpCircle size={14} />
                    </button>

                    {/* SYSTEM MENU TRIGGER */}
                    <div className="relative" ref={systemMenuRef}>
                        <button type="button"
                            onClick={() => {
                                sensory.pulse();
                                setSystemMenuOpen(prev => !prev);
                            }}
                            className="ml-1 p-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                        >
                            <Shield size={14} />
                        </button>

                        {/* DROPDOWN MENU */}
                        {systemMenuOpen && (
                            <div className="absolute top-10 right-0 w-48 bg-[#050505]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in slide-in-from-top-2 text-left">
                                <span className="block px-3 py-1.5 text-[9px] font-bold text-white/40 mb-1">System Protocols</span>
                                <ProtocolOption label="Deep Ignite" icon={<Zap size={12} />} onClick={() => sendCommand('sys:ignite')} color="text-cyan-400" />
                                <ProtocolOption label="Deep Snapshot" icon={<Database size={12} />} onClick={() => sendCommand('sys:snapshot')} color="text-emerald-400" />
                                <div className="h-[1px] bg-white/5 my-1 mx-2" />
                                <ProtocolOption label="Bridge Sync" icon={<RefreshCw size={12} />} onClick={() => sendCommand('sage:Force bridge sync.')} color="text-blue-400" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.header>
    );
}

const TelemetryPill = React.memo(({ label, value, icon, active, pulse, color = "cyan" }: any) => {
    const colorClasses: Record<string, string> = {
        cyan: "text-cyan-400",
        violet: "text-violet-400",
        emerald: "text-emerald-400",
        red: "text-red-400",
        amber: "text-amber-400"
    };

    const activeColor = colorClasses[color] || "text-white";

    return (
        <div className={cn("flex items-center gap-2 px-2 py-0.5 transition-opacity duration-500", !active && "opacity-30 grayscale")}>
            <span className={cn(pulse && "animate-pulse", activeColor, "transition-colors duration-500")}>{icon}</span>
            <div className="flex gap-1.5 items-center">
                <div className="text-[9px] font-mono font-bold text-white/80 overflow-hidden h-[12px] flex items-center">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={value}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                        >
                            {value}
                        </motion.span>
                    </AnimatePresence>
                </div>
                <span className="text-[7px] font-bold text-white/20 uppercase tracking-wider">{label}</span>
            </div>
        </div>
    );
});

TelemetryPill.displayName = 'TelemetryPill';

const ActionButton = React.memo(({ onClick, icon, active, label }: any) => {
    return (
        <button type="button"
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-300 border",
                active
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-transparent border-transparent text-white/30 hover:text-white"
            )}
        >
            {icon}
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider">{label}</span>
        </button>
    );
});

ActionButton.displayName = 'ActionButton';

const ProtocolOption = React.memo(({ label, icon, onClick, color }: any) => {
    return (
        <button type="button"
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-white/5 active:scale-[0.98] group/opt",
                color
            )}
        >
            <div className="opacity-40 group-hover/opt:opacity-100 transition-opacity">
                {icon}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-left">{label}</span>
        </button>
    );
});

ProtocolOption.displayName = 'ProtocolOption';

interface NotificationItemProps {
    message: string;
    time: string;
    type: 'success' | 'info' | 'warning';
    onDismiss: () => void;
}

const NotificationItem = React.memo(({ message, time, type, onDismiss }: NotificationItemProps) => {
    const typeStyles: Record<string, string> = {
        success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    };

    return (
        <div className={cn("mx-2 mb-1 p-2 rounded-lg border transition-all hover:bg-white/5 group", typeStyles[type])}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-medium leading-tight truncate">{message}</p>
                    <span className="text-[8px] opacity-50 mt-0.5 block">{time}</span>
                </div>
                <button type="button"
                    onClick={onDismiss}
                    className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                    <X size={10} />
                </button>
            </div>
        </div>
    );
});

NotificationItem.displayName = 'NotificationItem';
