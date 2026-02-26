'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, ExternalLink, QrCode, RefreshCcw, Lock, Unlock, Wifi, WifiOff } from 'lucide-react';
import { useTelemetry } from '@/components/providers/TelemetryProvider';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';

export default function NexusGate() {
    const { services, gateUrl, localIp, setServiceStatus } = useTelemetry();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const isTunneling = services.gate === 'online' && !!gateUrl;

    // Determine what to show: Tunnel URL, Local IP, or Offline
    const activeUrl = isTunneling ? gateUrl : (localIp ? `http://${localIp}:3001` : null);

    const toggleTunnel = async () => {
        setLoading(true);
        setShowConfirm(false);

        const command = isTunneling ? 'sys:close_gate' : 'sys:open_gate';


        // Optimistic Feedback
        setServiceStatus('gate', isTunneling ? 'offline' : 'connecting');

        try {
            const { error } = await supabase.from('ghost_bridge').insert({
                command,
                source: 'nexus_remote',
                status: 'pending'
            });

            if (error) throw error;

            // Stay loading until the heartbeat reflects the change
            // But with the pulse fix, this will resolve much faster
            setTimeout(() => setLoading(false), 3000);
        } catch (err) {
            console.error('[GATE_ERROR] Failed to toggle gate:', err);
            setLoading(false);
            setServiceStatus('gate', isTunneling ? 'online' : 'offline');
        }
    };

    // Verbose Monitor
    useEffect(() => {
        // Monitoring gate URL changes
    }, [gateUrl]);

    return (
        <NeuralSurface variant="glass" className="p-10 border-white/5 relative overflow-hidden rounded-[3rem] shadow-2xl">
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl p-8 flex items-center justify-center"
                    >
                        <div className="glass-card max-w-md w-full p-10 space-y-8 text-center border-white/10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
                            <div className="space-y-3">
                                <div className={cn("mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4", isTunneling ? "bg-rose-500/10 text-rose-400" : "bg-cyan-500/10 text-cyan-400")}>
                                    {isTunneling ? <Lock size={32} /> : <Unlock size={32} />}
                                </div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">
                                    {isTunneling ? 'Terminate Uplink?' : 'Open Secure Bridge?'}
                                </h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest opacity-80">
                                    {isTunneling
                                        ? 'Closing the gate will instantly sever all external remote connections to your local infrastructure.'
                                        : 'This will establish an encrypted tunnel to your local network, allowing external remote access.'}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <NeuralButton
                                    variant="secondary"
                                    className="flex-1 h-14 rounded-2xl text-[10px]"
                                    onClick={() => setShowConfirm(false)}
                                >
                                    Cancel
                                </NeuralButton>
                                <NeuralButton
                                    variant={isTunneling ? 'danger' : 'primary'}
                                    className="flex-1 h-14 rounded-2xl text-[10px]"
                                    onClick={toggleTunnel}
                                    glow={!isTunneling}
                                >
                                    {isTunneling ? 'Sever_Gate' : 'Open_Link'}
                                </NeuralButton>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className={cn("p-4 rounded-[1.5rem] shadow-xl transition-all duration-500", isTunneling ? "bg-cyan-500/20 text-cyan-400" : (activeUrl ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"))}>
                            <Globe size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Matrix_Gate</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">
                                {isTunneling ? "Neural Hubbard Uplink Active" : (activeUrl ? "Local Interface Available" : "Gate Protocol Restricted")}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="flex-1 xl:flex-none">
                        <NeuralButton
                            onClick={() => setShowConfirm(true)}
                            disabled={loading}
                            variant={isTunneling ? 'secondary' : 'primary'}
                            className="w-full xl:w-auto h-16 px-10 rounded-3xl text-[10px] font-black tracking-widest"
                            glow={!isTunneling}
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <RefreshCcw className="animate-spin" size={18} />
                                    <span>Syncing...</span>
                                </div>
                            ) : isTunneling ? (
                                <div className="flex items-center gap-3">
                                    <Lock size={18} className="text-rose-400" /> Close_Link
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Unlock size={18} className="text-white" /> Open_Secure_Gate
                                </div>
                            )}
                        </NeuralButton>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeUrl ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="mt-10 pt-10 border-t border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-10"
                    >
                        <div className="lg:col-span-8 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2 pl-4 border-l-2 border-cyan-500/30">
                                    {isTunneling ? "Active_Remote_Endpoint" : "Local_Node_Interface"}
                                </label>
                                <div className="flex items-center gap-4 bg-black/60 border border-white/10 rounded-[1.8rem] p-5 group shadow-2xl relative overflow-hidden backdrop-blur-xl">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Globe className={cn("relative z-10 transition-transform group-hover:rotate-12", isTunneling ? "text-cyan-400" : "text-emerald-400")} size={24} />
                                    <code className={cn("text-xs md:text-sm font-mono flex-1 lowercase truncate relative z-10", isTunneling ? "text-cyan-300 font-bold" : "text-emerald-300")}>
                                        {activeUrl}
                                    </code>
                                    <a
                                        href={activeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-white/5 hover:bg-cyan-500/20 rounded-xl text-slate-400 hover:text-white transition-all relative z-10"
                                    >
                                        <ExternalLink size={20} />
                                    </a>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {isTunneling ? (
                                    <>
                                        <div className="p-6 rounded-[2rem] bg-cyan-500/[0.03] border border-cyan-500/10 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Shield className="text-cyan-400" size={18} />
                                                <span className="text-[9px] text-cyan-400 font-black uppercase tracking-tighter">RSA_AES_Secure</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">Tunnel protocol active // Handshake verified via Hubbard.</p>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-cyan-500/[0.03] border border-cyan-500/10 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Wifi className="text-cyan-400" size={18} />
                                                <span className="text-[9px] text-cyan-400 font-black uppercase tracking-tighter">Synced</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">Direct port 3001 mapping established // Latency: nominal.</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-6 rounded-[2rem] bg-emerald-500/[0.03] border border-emerald-500/10 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Shield className="text-emerald-400" size={18} />
                                                <span className="text-[9px] text-emerald-400 font-black uppercase tracking-tighter">Internal_Verified</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">Trusted local network connection active // No external leaks.</p>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-emerald-500/[0.03] border border-emerald-500/10 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Wifi className="text-emerald-400" size={18} />
                                                <span className="text-[9px] text-emerald-400 font-black uppercase tracking-tighter">LAN_Active</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">Accessible to all devices on the current subnet.</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-6">
                            <div className="relative group p-6 bg-white/[0.02] border border-white/5 rounded-[3rem] backdrop-blur-md shadow-2xl transition-all hover:border-white/10 overflow-hidden">
                                {/* Neural Pulse Overlay */}
                                <div className={cn("absolute inset-0 animate-pulse rounded-[3rem]", isTunneling ? "bg-cyan-400/[0.03]" : "bg-emerald-400/[0.03]")} />

                                <div className={cn("p-5 bg-white rounded-[1.8rem] relative z-10 transition-transform duration-700 group-hover:scale-105", isTunneling ? "shadow-[0_0_60px_-10px_rgba(34,211,238,0.4)]" : "shadow-[0_0_60px_-10px_rgba(52,211,153,0.4)]")}>
                                    <QRCodeSVG
                                        value={activeUrl || ''}
                                        size={140}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                                <div className={cn("absolute -bottom-4 -right-4 w-16 h-16 blur-2xl rounded-full", isTunneling ? "bg-cyan-500/20" : "bg-emerald-500/20")} />
                            </div>
                            <div className="space-y-2 text-center">
                                <p className="text-[11px] text-white font-black uppercase tracking-[0.3em]">{isTunneling ? "Handover_Beacon" : "Local_Sync_Beacon"}</p>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic opacity-60">Scan to handoff neural session</p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-10 flex items-center justify-center p-12 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] text-slate-500 gap-4"
                    >
                        <Lock size={20} className="text-slate-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Aether_Gate_Status // STANDBY_MODE</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Decorative ambient elements */}
            {activeUrl && (
                <div className={cn("absolute -bottom-20 -right-20 w-80 h-80 blur-[100px] rounded-full opacity-20", isTunneling ? "bg-cyan-500" : "bg-emerald-500")} />
            )}

            {/* SYSTEM CONTROLS UPGRADE */}
            <div className="mt-10 pt-10 border-t border-white/5">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 px-2 pl-4 border-l-2 border-white/10">
                    System_Matrix_Controls
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <NeuralButton
                        variant="secondary"
                        className="h-12 rounded-xl text-[9px] font-bold"
                        onClick={async () => {
                            setServiceStatus('reflect', 'connecting');
                            await supabase.from('ghost_bridge').insert({ command: 'sys:restart_reflect', status: 'pending' });
                        }}
                    >
                        Restart_Reflect
                    </NeuralButton>
                    <NeuralButton
                        variant="secondary"
                        className="h-12 rounded-xl text-[9px] font-bold"
                        onClick={async () => {
                            setServiceStatus('ghost', 'connecting');
                            await supabase.from('ghost_bridge').insert({ command: 'sys:restart_ghost', status: 'pending' });
                        }}
                    >
                        Restart_Ghost
                    </NeuralButton>
                    <NeuralButton
                        variant="secondary"
                        className="h-12 rounded-xl text-[9px] font-bold"
                        onClick={async () => {
                            setServiceStatus('nexus', 'connecting');
                            await supabase.from('ghost_bridge').insert({ command: 'sys:restart_nexus', status: 'pending' });
                        }}
                    >
                        Restart_Hub
                    </NeuralButton>
                    <NeuralButton
                        variant="danger"
                        className="h-12 rounded-xl text-[9px] font-bold border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
                        onClick={async () => {
                            if (confirm('CRITICAL: Purge all systems?')) {
                                await supabase.from('ghost_bridge').insert({ command: 'sys:purge', status: 'pending' });
                            }
                        }}
                    >
                        SYSTEM_PURGE
                    </NeuralButton>
                </div>
            </div>
        </NeuralSurface>
    );
}
