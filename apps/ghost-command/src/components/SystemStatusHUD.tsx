'use client';

import React from 'react';
import { useSage } from '@/context/SageContext';
import { Activity, Cpu, Database, Wifi, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { NeuralSurface } from './ui/NeuralSurface';

export const SystemStatusHUD: React.FC = () => {
    const { systemHealth, status, sendCommand } = useSage();
    const [isMounted, setIsMounted] = React.useState(false);
    const isAiThinking = status === 'thinking' || status === 'executing';

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div className="h-20 bg-white/5 rounded-xl animate-pulse" />;

    return (
        <NeuralSurface variant="glass" className="p-0 overflow-hidden z-20 w-full" style={{ padding: 0 }}>
            <div className="flex items-center justify-between gap-2 p-2 sm:p-3 relative">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                <div className="flex-1 flex items-center justify-around gap-1 sm:gap-4 relative z-10">
                    {/* 1. HOST LINK */}
                    <StatusPod
                        label="UPLINK"
                        icon={<Wifi size={12} />}
                        active={systemHealth.online}
                        color="text-emerald-500"
                        borderColor="border-emerald-500/30"
                        glowColor="rgba(16, 185, 129, 0.2)"
                        value={systemHealth.online ? 'SECURE' : 'OFF'}
                    />

                    {/* 2. NEURAL CORE (AI) */}
                    <StatusPod
                        label="NEURAL"
                        icon={<Activity size={12} />}
                        active={systemHealth.ai_status === 'ONLINE'}
                        pulse={isAiThinking}
                        color={systemHealth.ai_status === 'ONLINE' ? 'text-cyan-400' : 'text-rose-500'}
                        borderColor={systemHealth.ai_status === 'ONLINE' ? 'border-cyan-500/30' : 'border-rose-500/30'}
                        glowColor={systemHealth.ai_status === 'ONLINE' ? 'rgba(34, 211, 238, 0.2)' : 'rgba(244, 63, 94, 0.2)'}
                        value={systemHealth.ai_status === 'ONLINE' ? 'ACTIVE' : systemHealth.ai_status}
                    />

                    {/* 3. RAM USAGE */}
                    <StatusPod
                        label="MEMORY"
                        icon={<Database size={12} />}
                        active={systemHealth.online}
                        color="text-purple-400"
                        borderColor="border-purple-500/30"
                        glowColor="rgba(168, 85, 247, 0.2)"
                        value={systemHealth.online ? `${Math.round(Number(systemHealth.ram))}%` : '--'}
                    />

                    <StatusPod
                        label="CORE"
                        icon={<Cpu size={12} />}
                        active={systemHealth.online}
                        color="text-amber-400"
                        borderColor="border-amber-500/30"
                        glowColor="rgba(251, 191, 36, 0.2)"
                        value={systemHealth.online ? systemHealth.cpu : '--'}
                    />

                    {/* 5. CLOUD BRIDGE (Launcher) */}
                    <StatusPod
                        label="CLOUD"
                        icon={<Cloud size={12} />}
                        active={true}
                        color="text-blue-400"
                        borderColor="border-blue-500/30"
                        glowColor="rgba(59, 130, 246, 0.4)"
                        value="LAUNCH"
                        onClick={() => sendCommand('sys:cloud_ignite')}
                        className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    />
                </div>
            </div>
        </NeuralSurface>
    );
};

const StatusPod = ({ label, icon, active, color, borderColor, glowColor, value, pulse, onClick, className }: any) => (
    <div
        onClick={onClick}
        className={cn(
            "flex flex-col items-center gap-1.5 transition-all duration-300",
            active ? "opacity-100" : "opacity-30",
            className
        )}
    >
        <div className="hidden sm:block text-[8px] font-extrabold opacity-50 tracking-widest uppercase text-white">
            {label}
        </div>
        <motion.div
            animate={pulse ? {
                scale: [1, 1.1, 1],
                backgroundColor: ['rgba(255,255,255,0.02)', glowColor, 'rgba(255,255,255,0.02)']
            } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border transition-colors",
                active ? `${color} ${borderColor} bg-white/5` : "text-neutral-500 border-white/10 bg-transparent"
            )}
            style={{ boxShadow: active && pulse ? `0 0 15px ${glowColor}` : 'none' }}
        >
            {icon}
        </motion.div>
        <div className={cn("text-[9px] font-bold font-mono tracking-wider", active ? "text-white" : "text-neutral-500")}>
            {value}
        </div>
    </div>
);
