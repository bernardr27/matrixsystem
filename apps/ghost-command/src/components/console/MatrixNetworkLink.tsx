'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Globe, Wifi, Shield, Activity, Radio, Server, Share2 } from 'lucide-react';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { cn } from '@/lib/utils';
import { useSage } from '@/context/SageContext';

interface ServiceNode {
    id: string;
    label: string;
    port: number;
    status: 'online' | 'offline' | 'unknown';
    latency: number;
    type: 'core' | 'app' | 'relay' | 'db';
}

interface NetworkScan {
    nodes: ServiceNode[];
    interfaces: { name: string; address: string; family: string }[];
    totalOnline: number;
    totalServices: number;
    timestamp: string;
}

export default function MatrixNetworkLink() {
    const { systemHealth } = useSage();
    const [scanning, setScanning] = useState(false);
    const [lastScan, setLastScan] = useState<NetworkScan | null>(null);
    const [trafficData, setTrafficData] = useState<number[]>(Array(12).fill(0));

    // Seed nodes from context + live health scan
    const [nodes, setNodes] = useState<ServiceNode[]>([
        { id: 'ghost', label: 'Ghost Command', port: 5173, status: 'online', latency: 0, type: 'core' },
        { id: 'reflect', label: 'Reflect', port: 3000, status: 'unknown', latency: 0, type: 'app' },
        { id: 'nexus', label: 'Nexus', port: 3001, status: 'unknown', latency: 0, type: 'app' },
        { id: 'runner', label: 'AI Runner', port: 3333, status: 'unknown', latency: 0, type: 'relay' },
        { id: 'rocket', label: 'Rocket', port: 4000, status: 'unknown', latency: 0, type: 'app' },
    ]);

    // Update node statuses from systemHealth context
    useEffect(() => {
        setNodes(prev => prev.map(n => {
            if (n.id === 'ghost') return { ...n, status: 'online' as const, latency: 0 };
            if (n.id === 'runner') {
                const online = systemHealth.ai_status === 'ONLINE' || systemHealth.online;
                return { ...n, status: online ? 'online' as const : 'offline' as const, latency: systemHealth.networkLatency };
            }
            return n;
        }));
    }, [systemHealth.online, systemHealth.ai_status, systemHealth.networkLatency]);

    // Real network scan — pings all services, fetches health API for real data
    const handleScan = useCallback(async () => {
        if (scanning) return;
        setScanning(true);

        try {
            // Fetch real health data (includes service checks and network interfaces)
            const healthRes = await fetch('/api/health', { cache: 'no-store' });
            const health = healthRes.ok ? await healthRes.json() : null;

            // Ping each service directly for accurate latency (env vars for production)
            const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
            const ghostUrl = process.env.NEXT_PUBLIC_GHOST_URL || `http://${host}:5173`;
            const reflectUrl = process.env.NEXT_PUBLIC_REFLECT_URL || `http://${host}:3000`;
            const nexusUrl = process.env.NEXT_PUBLIC_NEXUS_URL || `http://${host}:3001`;
            const runnerUrl = process.env.NEXT_PUBLIC_RUNNER_URL || `http://${host}:3333`;
            const rocketUrl = process.env.NEXT_PUBLIC_ROCKET_URL || `http://${host}:4000`;

            const pings = await Promise.allSettled([
                measureLatency(`${ghostUrl}/api/health`),
                measureLatency(`${reflectUrl}/api/health`),
                measureLatency(`${nexusUrl}/api/health`),
                measureLatency(`${runnerUrl}/status`),
                measureLatency(`${rocketUrl}/api/health`),
            ]);

            const serviceMap = health?.services || {};
            const updatedNodes: ServiceNode[] = [
                {
                    id: 'ghost', label: 'Ghost Command', port: 5173, type: 'core',
                    status: 'online',
                    latency: pings[0].status === 'fulfilled' ? pings[0].value : 0,
                },
                {
                    id: 'reflect', label: 'Reflect', port: 3000, type: 'app',
                    status: serviceMap.reflect === 'online' ? 'online' : 'offline',
                    latency: pings[1].status === 'fulfilled' ? pings[1].value : 0,
                },
                {
                    id: 'nexus', label: 'Nexus', port: 3001, type: 'app',
                    status: serviceMap.nexus === 'online' ? 'online' : 'offline',
                    latency: pings[2].status === 'fulfilled' ? pings[2].value : 0,
                },
                {
                    id: 'runner', label: 'AI Runner', port: 3333, type: 'relay',
                    status: serviceMap.runner === 'online' ? 'online' : 'offline',
                    latency: pings[3].status === 'fulfilled' ? pings[3].value : 0,
                },
                {
                    id: 'rocket', label: 'Rocket', port: 4000, type: 'app',
                    status: serviceMap.rocketCommand === 'online' ? 'online' : 'offline',
                    latency: pings[4].status === 'fulfilled' ? pings[4].value : 0,
                },
            ];

            setNodes(updatedNodes);

            const onlineCount = updatedNodes.filter(n => n.status === 'online').length;
            setLastScan({
                nodes: updatedNodes,
                interfaces: health?.network?.interfaces || [],
                totalOnline: onlineCount,
                totalServices: updatedNodes.length,
                timestamp: new Date().toISOString(),
            });

            // Generate traffic data from real latency values
            const avgLatency = updatedNodes.reduce((sum, n) => sum + n.latency, 0) / updatedNodes.length;
            setTrafficData(prev => {
                const next = [...prev.slice(1), Math.min(100, Math.round(avgLatency * 2 + Math.random() * 10))];
                return next;
            });

        } catch {
            // Even on error, mark scan complete
        } finally {
            setScanning(false);
        }
    }, [scanning]);

    // Auto-scan on mount
    useEffect(() => { handleScan(); }, [handleScan]);

    // Periodic light traffic data update (every 10s)
    useEffect(() => {
        const interval = setInterval(() => {
            setTrafficData(prev => {
                const latency = systemHealth.networkLatency || 5;
                const next = [...prev.slice(1), Math.min(100, Math.round(latency * 2 + Math.random() * 15))];
                return next;
            });
        }, 10000);
        return () => clearInterval(interval);
    }, [systemHealth.networkLatency]);

    const onlineCount = nodes.filter(n => n.status === 'online').length;

    return (
        <div className="flex flex-col h-full bg-[#0a0f1a] p-6 relative overflow-hidden text-slate-200">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

            {/* HEADER */}
            <div className="flex items-center justify-between mb-8 z-10 flex-wrap gap-3">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.25)]">
                        <Globe size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-50">Network Uplink</h1>
                        <p className="text-xs text-slate-400">
                            {onlineCount}/{nodes.length} services online
                            {lastScan && ` · Scanned ${new Date(lastScan.timestamp).toLocaleTimeString()}`}
                        </p>
                    </div>
                </div>
                <button type="button"
                    onClick={handleScan}
                    disabled={scanning}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-all",
                        scanning
                            ? "bg-blue-500/15 border-blue-500/30 text-blue-200 animate-pulse cursor-not-allowed"
                            : "bg-slate-900/70 border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/50"
                    )}
                >
                    <Radio size={14} className={scanning ? "animate-spin" : ""} />
                    {scanning ? 'Scanning...' : 'Scan topology'}
                </button>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 min-h-0 overflow-y-auto lg:overflow-visible">
                {/* LEFT: STATUS PANEL */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Service Status */}
                    <NeuralSurface className="p-6 bg-slate-900/60 border-slate-700/40 backdrop-blur-md">
                        <h3 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <Shield size={14} className="text-blue-400" /> Service Status
                        </h3>
                        <div className="space-y-3">
                            {nodes.map(node => (
                                <StatusRow
                                    key={node.id}
                                    label={`${node.label} (:${node.port})`}
                                    value={node.status === 'online' ? `${node.latency}ms` : 'DOWN'}
                                    status={node.status === 'online' ? 'ok' : node.status === 'offline' ? 'err' : 'warn'}
                                />
                            ))}
                        </div>
                    </NeuralSurface>

                    {/* Network Interfaces */}
                    {lastScan && lastScan.interfaces.length > 0 && (
                        <NeuralSurface className="p-6 bg-slate-900/60 border-slate-700/40 backdrop-blur-md">
                            <h3 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-2">
                                <Wifi size={14} className="text-indigo-400" /> Network Interfaces
                            </h3>
                            <div className="space-y-2">
                                {lastScan.interfaces.map((iface, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/60">
                                        <span className="text-[10px] font-mono text-slate-400">{iface.name}</span>
                                        <span className="text-[10px] font-mono text-blue-300">{iface.address}</span>
                                    </div>
                                ))}
                            </div>
                        </NeuralSurface>
                    )}

                    {/* Traffic Graph */}
                    <NeuralSurface className="p-6 bg-slate-900/60 border-slate-700/40 backdrop-blur-md">
                        <h3 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <Activity size={14} className="text-indigo-400" /> Latency History
                        </h3>
                        <div className="h-32 flex items-end justify-between gap-1 px-2 border-b border-white/5 pb-2">
                            {trafficData.map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: '0%' }}
                                    animate={{ height: `${Math.max(h, 2)}%` }}
                                    transition={{ duration: 0.4 }}
                                    className={cn(
                                        "w-full rounded-t-sm transition-colors",
                                        h > 70 ? "bg-red-500/40" : h > 40 ? "bg-amber-500/30" : "bg-blue-500/20 hover:bg-blue-400/50"
                                    )}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-mono">
                            <span>Avg: {Math.round(trafficData.reduce((a, b) => a + b, 0) / trafficData.length)}ms</span>
                            <span>Peak: {Math.max(...trafficData)}ms</span>
                        </div>
                    </NeuralSurface>
                </div>

                {/* RIGHT: NODE MAP */}
                <div className="lg:col-span-2 relative min-h-[400px]">
                    <NeuralSurface className="h-full bg-slate-900/70 border-slate-700/40 overflow-hidden relative group">
                        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                            <span className={cn("w-2 h-2 rounded-full", onlineCount === nodes.length ? "bg-emerald-500 animate-pulse" : onlineCount > 0 ? "bg-amber-400 animate-pulse" : "bg-red-400")} />
                            <span className="text-[10px] font-semibold text-slate-200">
                                {onlineCount === nodes.length ? 'All Online' : `${onlineCount}/${nodes.length} Online`}
                            </span>
                        </div>

                        {/* Nodes Visualization */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {/* Central Hub */}
                            <div className="relative z-10">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-[-20px] border border-blue-500/25 rounded-full border-dashed"
                                />
                                <div className="w-24 h-24 rounded-full bg-blue-900/40 border border-blue-500/50 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.25)]">
                                    <Globe size={40} className="text-blue-300" strokeWidth={1} />
                                </div>
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-slate-200 bg-slate-900/80 px-2 py-1 rounded border border-slate-700/50">
                                    Matrix Core
                                </div>
                            </div>

                            {/* Satellite Nodes */}
                            {nodes.map((node, i) => {
                                const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
                                const radius = 160;
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                const isOnline = node.status === 'online';

                                return (
                                    <motion.div
                                        key={node.id}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1, x, y }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        className="absolute z-10"
                                    >
                                        <div className="relative group/node cursor-pointer">
                                            {/* Connection Line */}
                                            <svg
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none -z-10 opacity-30"
                                                viewBox="0 0 400 400"
                                                preserveAspectRatio="xMidYMid meet"
                                                style={{ transform: `translate(-50%, -50%) rotate(${angle + Math.PI}rad)` }}
                                            >
                                                <line x1="200" y1="200" x2="200" y2="40" stroke="currentColor" className={isOnline ? "text-blue-500" : "text-red-500"} strokeWidth="1" strokeDasharray={isOnline ? "none" : "4 4"} />
                                            </svg>

                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300",
                                                isOnline
                                                    ? "bg-slate-900/90 border-blue-500/40 shadow-[0_0_18px_rgba(59,130,246,0.2)] group-hover/node:bg-blue-950"
                                                    : "bg-slate-900/60 border-red-500/30 opacity-60"
                                            )}>
                                                {node.type === 'db' || node.type === 'app'
                                                    ? <Server size={20} className={isOnline ? "text-blue-300" : "text-red-300"} />
                                                    : node.type === 'relay'
                                                    ? <Share2 size={20} className={isOnline ? "text-indigo-300" : "text-red-300"} />
                                                    : <Wifi size={20} className={isOnline ? "text-emerald-300" : "text-red-300"} />}
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover/node:opacity-100 transition-opacity whitespace-nowrap bg-slate-900/95 border border-slate-700/60 px-3 py-1.5 rounded-lg text-center z-50">
                                                <div className="text-[10px] font-semibold text-slate-100">{node.label}</div>
                                                <div className={cn("text-[9px] font-mono", isOnline ? "text-blue-300" : "text-red-300")}>
                                                    {isOnline ? `${node.latency}ms · :${node.port}` : `OFFLINE · :${node.port}`}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </NeuralSurface>
                </div>
            </div>
        </div>
    );
}

/** Measure round-trip latency to a URL in ms */
async function measureLatency(url: string): Promise<number> {
    const start = Date.now();
    try {
        await fetch(url, { signal: AbortSignal.timeout(3000), cache: 'no-store' });
        return Date.now() - start;
    } catch {
        throw new Error('unreachable');
    }
}

function StatusRow({ label, value, status }: { label: string; value: string; status: 'ok' | 'warn' | 'err' }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] font-semibold text-slate-300">{label}</span>
            <div className="flex items-center gap-2">
                <span className={cn(
                    "text-[10px] font-mono font-semibold",
                    status === 'ok' ? "text-emerald-400" :
                        status === 'warn' ? "text-amber-400" : "text-red-400"
                )}>
                    {value}
                </span>
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    status === 'ok' ? "bg-emerald-500" :
                        status === 'warn' ? "bg-amber-500 animate-pulse" : "bg-red-500"
                )} />
            </div>
        </div>
    );
}
