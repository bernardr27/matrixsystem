'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Terminal, Play, Square, RotateCcw, Server, Rocket, Globe, Cpu, Flame,
    ExternalLink, AlertTriangle, ChevronDown, ChevronRight, Loader2,
    CheckCircle2, XCircle, Wifi, WifiOff, Trash2, Wrench, Activity,
    HardDrive, Clock, Shield, Zap, Download, Copy, Check
} from 'lucide-react';
import { RocketSurface, RocketButton } from '@/components/ui/RocketSurface';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ProgressBar, StatusIndicator, OperationEntry } from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';
import { Tooltip } from '@/components/ui/Tooltip';
import { useRocket, useGlobalUptime } from '@/components/providers/RocketProvider';
import { cn } from '@/lib/utils';

/* ── Types ── */
interface ServiceInfo {
    name: string;
    port: number;
    status: string;
    pid: number | null;
    latency: number | null;
    color: string;
}

interface CommandDef {
    id: string;
    label: string;
    danger: boolean;
    category: string;
}

interface CommandResult {
    id: number;
    commandId: string;
    label: string;
    status: 'running' | 'success' | 'error';
    output?: string;
    duration?: number;
    timestamp: number;
}

const serviceIcons: Record<string, React.ReactNode> = {
    ghost: <Rocket className="w-4 h-4" />,
    reflect: <Globe className="w-4 h-4" />,
    nexus: <Cpu className="w-4 h-4" />,
    rocket: <Flame className="w-4 h-4" />,
};

const serviceRoles: Record<string, string> = {
    ghost: 'Production',
    reflect: 'Mirror',
    nexus: 'Maintenance',
    rocket: 'Operator Hub',
};

const categoryLabels: Record<string, { label: string; color: string }> = {
    status: { label: 'Status', color: 'text-emerald-400' },
    build: { label: 'Build', color: 'text-cyan-400' },
    kill: { label: 'Kill', color: 'text-red-400' },
    git: { label: 'Git', color: 'text-violet-400' },
    npm: { label: 'NPM', color: 'text-orange-400' },
    clear: { label: 'Clear', color: 'text-amber-400' },
};

/* ═══════════════════════════════════════════════════════
   OPERATIONS CENTER — Full Service Management + Command Execution
   ═══════════════════════════════════════════════════════ */
export default function OperationsCenter() {
    const toast = useToast();
    const { cpu, memory, isConnected } = useRocket();
    const uptime = useGlobalUptime();

    /* ── Service state ── */
    const [services, setServices] = useState<Record<string, ServiceInfo>>({});
    const [loadingServices, setLoadingServices] = useState(true);
    const [serviceError, setServiceError] = useState(false);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    /* ── Commands ── */
    const [commands, setCommands] = useState<CommandDef[]>([]);
    const [commandResults, setCommandResults] = useState<CommandResult[]>([]);
    const [executingCmd, setExecutingCmd] = useState<string | null>(null);
    const [expandedResult, setExpandedResult] = useState<number | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const nextResultId = useRef(1);

    /* ── Tunnels ── */
    const [tunnelUrls, setTunnelUrls] = useState<Record<string, string>>({});
    const [tunnelAction, setTunnelAction] = useState<string | null>(null);

    /* ── Confirm modal ── */
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{
        type: 'service' | 'command' | 'tunnel';
        action: string;
        target: string;
        label: string;
    } | null>(null);

    /* ══════ Fetchers ══════ */
    const fetchServices = useCallback(async () => {
        try {
            const res = await fetch('/api/services');
            const data = await res.json();
            setServices(data.services || {});
            setServiceError(false);
        } catch {
            setServiceError(true);
        }
        setLoadingServices(false);
    }, []);

    const fetchCommands = useCallback(async () => {
        try {
            const res = await fetch('/api/execute');
            const data = await res.json();
            setCommands(data.commands || []);
        } catch {
            toast.warning('Commands unavailable', 'Failed to load command list');
        }
    }, [toast]);

    const fetchTunnels = useCallback(async () => {
        try {
            const res = await fetch('/api/tunnels');
            const data = await res.json();
            setTunnelUrls(data.tunnels || data.urls || {});
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchServices();
        fetchCommands();
        fetchTunnels();
        const i = setInterval(() => { fetchServices(); fetchTunnels(); }, 15000);
        return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ══════ Confirm gate ══════ */
    const requireConfirm = useCallback((type: 'service' | 'command' | 'tunnel', action: string, target: string, label: string) => {
        setPendingAction({ type, action, target, label });
        setConfirmOpen(true);
    }, []);

    const handleConfirm = useCallback(() => {
        if (!pendingAction) return;
        setConfirmOpen(false);
        const { type, action, target, label } = pendingAction;
        setPendingAction(null);

        if (type === 'service') executeServiceAction(action, target, label);
        if (type === 'command') executeCommand(target);
        if (type === 'tunnel') executeTunnelAction(action);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingAction]);

    /* ══════ Service actions ══════ */
    const requestServiceAction = useCallback((action: string, target: string, label: string) => {
        if (['stop', 'restart', 'stop_all', 'restart_all'].includes(action)) {
            requireConfirm('service', action, target, label);
        } else {
            executeServiceAction(action, target, label);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const executeServiceAction = useCallback(async (action: string, target: string, label: string) => {
        setActionInProgress(`${action}:${target}`);
        const toastId = toast.loading(label, `${action.replace('_', ' ')} in progress...`);

        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, target }),
            });
            const data = await res.json();

            if (data.error) {
                toast.update(toastId, { type: 'error', title: `${label} failed`, message: data.error, duration: 6000, dismissible: true });
            } else {
                const msg = data.message || (data.results ? 'All services processed' : 'Completed');
                toast.update(toastId, { type: 'success', title: label, message: typeof msg === 'string' ? msg : 'Done', duration: 4000, dismissible: true });
            }
            setTimeout(fetchServices, 1000);
        } catch (err) {
            toast.update(toastId, { type: 'error', title: `${label} failed`, message: String(err), duration: 6000, dismissible: true });
        }
        setActionInProgress(null);
    }, [fetchServices, toast]);

    /* ══════ Command execution ══════ */
    const requestCommand = useCallback((cmd: CommandDef) => {
        if (cmd.danger) {
            requireConfirm('command', 'execute', cmd.id, cmd.label);
        } else {
            executeCommand(cmd.id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const executeCommand = useCallback(async (commandId: string) => {
        const cmd = commands.find(c => c.id === commandId);
        if (!cmd) return;

        setExecutingCmd(commandId);
        const resultId = nextResultId.current++;
        const entry: CommandResult = {
            id: resultId,
            commandId,
            label: cmd.label,
            status: 'running',
            timestamp: Date.now(),
        };
        setCommandResults(prev => [entry, ...prev].slice(0, 30));

        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commandId }),
            });
            const data = await res.json();

            setCommandResults(prev => prev.map(r =>
                r.id === resultId
                    ? { ...r, status: data.success ? 'success' : 'error', output: data.output, duration: data.duration }
                    : r
            ));
            setExpandedResult(resultId);
        } catch (err) {
            setCommandResults(prev => prev.map(r =>
                r.id === resultId
                    ? { ...r, status: 'error', output: String(err) }
                    : r
            ));
        }
        setExecutingCmd(null);
        // Refresh services after kill or build commands
        if (commandId.startsWith('kill:') || commandId.startsWith('build:')) {
            setTimeout(fetchServices, 2000);
        }
    }, [commands, fetchServices]);

    /* ══════ Tunnel actions ══════ */
    const requestTunnelAction = useCallback((action: string) => {
        if (action === 'stop') {
            requireConfirm('tunnel', action, 'tunnels', 'Stop All Tunnels');
        } else {
            executeTunnelAction(action);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const executeTunnelAction = useCallback(async (action: string) => {
        setTunnelAction(action);

        // Create a result entry for feedback
        const resultId = nextResultId.current++;
        const label = action === 'start' ? 'Start Tunnels' : 'Stop Tunnels';
        const entry: CommandResult = {
            id: resultId,
            commandId: `tunnel:${action}`,
            label,
            status: 'running',
            timestamp: Date.now(),
        };
        setCommandResults(prev => [entry, ...prev].slice(0, 30));

        try {
            const res = await fetch('/api/tunnels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                setCommandResults(prev => prev.map(r =>
                    r.id === resultId
                        ? { ...r, status: 'error', output: data.error || 'Tunnel operation failed', duration: Date.now() - entry.timestamp }
                        : r
                ));
                setExpandedResult(resultId);
                setTunnelAction(null);
                return;
            }

            // Show initial success
            setCommandResults(prev => prev.map(r =>
                r.id === resultId
                    ? { ...r, output: data.message || `Tunnel ${action} initiated` }
                    : r
            ));

            if (action === 'start') {
                // Poll for tunnel URLs every 3s for up to 45s (tunnels need ~10-15s)
                let found = false;
                for (let i = 0; i < 15; i++) {
                    await new Promise(r => setTimeout(r, 3000));
                    try {
                        const urlRes = await fetch('/api/tunnels');
                        const urlData = await urlRes.json();
                        const urls = urlData.tunnels || urlData.urls || {};
                        if (Object.keys(urls).length > 0) {
                            setTunnelUrls(urls);
                            const urlList = Object.entries(urls).map(([k, v]) => `${k}: ${v}`).join('\n');
                            setCommandResults(prev => prev.map(r =>
                                r.id === resultId
                                    ? { ...r, status: 'success', output: `Tunnels established:\n${urlList}`, duration: Date.now() - entry.timestamp }
                                    : r
                            ));
                            setExpandedResult(resultId);
                            found = true;
                            break;
                        }
                    } catch { /* keep polling */ }
                }
                if (!found) {
                    setCommandResults(prev => prev.map(r =>
                        r.id === resultId
                            ? { ...r, status: 'error', output: 'Tunnels did not establish within 45s. Check that your apps are running and cloudflared is installed.', duration: Date.now() - entry.timestamp }
                            : r
                    ));
                    setExpandedResult(resultId);
                }
            } else {
                // Stop action — immediate success
                setTunnelUrls({});
                setCommandResults(prev => prev.map(r =>
                    r.id === resultId
                        ? { ...r, status: 'success', output: data.message || 'All tunnels stopped', duration: Date.now() - entry.timestamp }
                        : r
                ));
                setExpandedResult(resultId);
                setTimeout(fetchTunnels, 2000);
            }
        } catch (err) {
            setCommandResults(prev => prev.map(r =>
                r.id === resultId
                    ? { ...r, status: 'error', output: `Network error: ${String(err)}`, duration: Date.now() - entry.timestamp }
                    : r
            ));
            setExpandedResult(resultId);
        }
        setTunnelAction(null);
    }, [fetchTunnels]);

    /* ══════ Computed ══════ */
    const onlineCount = Object.values(services).filter(s => s.status === 'online').length;
    const totalCount = Object.keys(services).length || 4;
    const activeTunnels = Object.keys(tunnelUrls).length;
    const groupedCommands = commands.reduce<Record<string, CommandDef[]>>((acc, cmd) => {
        (acc[cmd.category] = acc[cmd.category] || []).push(cmd);
        return acc;
    }, {});
    const avgLatency = Object.values(services).filter(s => s.latency !== null).reduce((sum, s) => sum + (s.latency || 0), 0) / (Object.values(services).filter(s => s.latency !== null).length || 1);

    const copyTunnelUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
        toast.info('Copied', 'Tunnel URL copied to clipboard');
    };

    return (
        <div className="p-4 md:p-6 xl:p-8 max-w-[1920px] mx-auto space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/15 flex items-center justify-center shadow-[0_0_20px_rgba(255,107,53,0.1)]">
                        <Terminal className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-display font-bold text-white">Operations Center</h1>
                            <span className="text-[9px] font-mono text-orange-400/50 bg-orange-500/5 px-1.5 py-0.5 rounded-md border border-orange-500/10">v3.0</span>
                        </div>
                        <p className="text-sm text-white/40">Service lifecycle · command execution · tunnel management</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Tooltip content="Export operations log">
                        <button onClick={() => {
                            const data = { services, commandResults, tunnelUrls, timestamp: new Date().toISOString() };
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url; a.download = `ops-log-${Date.now()}.json`; a.click();
                            URL.revokeObjectURL(url);
                            toast.success('Exported', 'Operations log saved');
                        }} className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-orange-500/25 text-white/30 hover:text-white/60 transition-all">
                            <Download className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <RocketButton variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => { fetchServices(); fetchTunnels(); }}>
                        Refresh
                    </RocketButton>
                </div>
            </div>

            {/* ═══ SYSTEM OVERVIEW STRIP ═══ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 stagger-children">
                <RocketSurface className="p-3 holo-card text-center">
                    <Server className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
                    <span className="text-lg font-display font-bold text-white">{onlineCount}/{totalCount}</span>
                    <span className="text-[9px] text-white/30 block uppercase">Services</span>
                </RocketSurface>
                <RocketSurface className="p-3 holo-card text-center">
                    <Cpu className="w-4 h-4 text-cyan-400 mx-auto mb-1.5" />
                    <span className="text-lg font-display font-bold text-white">{cpu || 0}%</span>
                    <span className="text-[9px] text-white/30 block uppercase">CPU</span>
                </RocketSurface>
                <RocketSurface className="p-3 holo-card text-center">
                    <HardDrive className="w-4 h-4 text-violet-400 mx-auto mb-1.5" />
                    <span className="text-lg font-display font-bold text-white">{memory || 0}%</span>
                    <span className="text-[9px] text-white/30 block uppercase">Memory</span>
                </RocketSurface>
                <RocketSurface className="p-3 holo-card text-center">
                    <Activity className="w-4 h-4 text-orange-400 mx-auto mb-1.5" />
                    <span className="text-lg font-display font-bold text-white">{Math.round(avgLatency)}ms</span>
                    <span className="text-[9px] text-white/30 block uppercase">Avg Latency</span>
                </RocketSurface>
                <RocketSurface className="p-3 holo-card text-center">
                    <Globe className="w-4 h-4 text-cyan-400 mx-auto mb-1.5" />
                    <span className="text-lg font-display font-bold text-white">{activeTunnels}</span>
                    <span className="text-[9px] text-white/30 block uppercase">Tunnels</span>
                </RocketSurface>
                <RocketSurface className="p-3 holo-card text-center">
                    <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1.5" />
                    <span className="text-lg font-display font-bold text-white font-mono text-sm">{uptime}</span>
                    <span className="text-[9px] text-white/30 block uppercase">Uptime</span>
                </RocketSurface>
            </div>

            {/* ═══ SERVICE FLEET ═══ */}
            <RocketSurface className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 flex-wrap">
                        <Server className="w-4 h-4 text-orange-400" />
                        Service Fleet
                        <span className="text-[10px] text-white/30 font-mono ml-2">{onlineCount}/{totalCount} ONLINE</span>
                        {serviceError && (
                            <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> API unreachable
                            </span>
                        )}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <RocketButton
                            variant="primary"
                            size="sm"
                            icon={<Play className="w-3 h-3" />}
                            onClick={() => requestServiceAction('start_all', '_all', 'Start All Services')}
                            disabled={actionInProgress !== null}
                        >
                            Start All
                        </RocketButton>
                        <RocketButton
                            variant="ghost"
                            size="sm"
                            icon={<RotateCcw className="w-3 h-3" />}
                            onClick={() => requestServiceAction('restart_all', '_all', 'Restart All Services')}
                            disabled={actionInProgress !== null}
                        >
                            Restart All
                        </RocketButton>
                        <RocketButton
                            variant="danger"
                            size="sm"
                            icon={<Square className="w-3 h-3" />}
                            onClick={() => requestServiceAction('stop_all', '_all', 'Stop All Services')}
                            disabled={actionInProgress !== null}
                        >
                            Stop All
                        </RocketButton>
                    </div>
                </div>

                {/* Operation progress */}
                {actionInProgress && (
                    <ProgressBar label={`Executing: ${actionInProgress.replace(':', ' ')}`} status="running" showTimer className="mb-3" />
                )}

                {loadingServices ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/[0.02] rounded-xl animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3">
                        {Object.entries(services).map(([key, svc]) => {
                            const accentBorder = key === 'ghost' ? 'border-l-cyan-400' : key === 'reflect' ? 'border-l-violet-400' : key === 'nexus' ? 'border-l-emerald-400' : 'border-l-orange-400';
                            return (
                            <div key={key} className={cn(
                                'rounded-xl p-4 border border-l-2 transition-all holo-card',
                                accentBorder,
                                svc.status === 'online'
                                    ? 'bg-white/[0.02] border-white/[0.06] hover:border-emerald-500/20'
                                    : 'bg-white/[0.01] border-white/[0.04] hover:border-red-500/15'
                            )}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn(
                                            'w-9 h-9 rounded-lg flex items-center justify-center',
                                            svc.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.05] text-white/30'
                                        )}>
                                            {serviceIcons[key] || <Server className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white/80">{svc.name}</span>
                                                <span className="text-[10px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded-full">{serviceRoles[key]}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <StatusIndicator status={svc.status === 'online' ? 'online' : 'offline'} label={svc.status} />
                                                <span className="text-[10px] text-white/20 font-mono">:{svc.port}</span>
                                                {svc.pid && <span className="text-[10px] text-white/15 font-mono">PID {svc.pid}</span>}
                                                {svc.latency !== null && <span className="text-[10px] text-white/15 font-mono">{svc.latency}ms</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Service action buttons */}
                                {key !== 'rocket' ? (
                                    <div className="flex items-center gap-2">
                                        {svc.status !== 'online' ? (
                                            <RocketButton
                                                variant="primary"
                                                size="sm"
                                                icon={<Play className="w-3 h-3" />}
                                                onClick={() => requestServiceAction('start', key, `Start ${svc.name}`)}
                                                disabled={actionInProgress !== null}
                                                className="flex-1"
                                            >
                                                Start
                                            </RocketButton>
                                        ) : (
                                            <>
                                                <RocketButton
                                                    variant="secondary"
                                                    size="sm"
                                                    icon={<RotateCcw className="w-3 h-3" />}
                                                    onClick={() => requestServiceAction('restart', key, `Restart ${svc.name}`)}
                                                    disabled={actionInProgress !== null}
                                                    className="flex-1"
                                                >
                                                    Restart
                                                </RocketButton>
                                                <RocketButton
                                                    variant="danger"
                                                    size="sm"
                                                    icon={<Square className="w-3 h-3" />}
                                                    onClick={() => requestServiceAction('stop', key, `Stop ${svc.name}`)}
                                                    disabled={actionInProgress !== null}
                                                    className="flex-1"
                                                >
                                                    Stop
                                                </RocketButton>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-[10px] text-orange-400/40 font-mono">
                                        <Flame className="w-3 h-3" /> SELF — Cannot stop operator
                                    </div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                )}
            </RocketSurface>

            {/* ═══ COMMAND EXECUTION + TUNNEL MANAGEMENT ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Commands — 2 cols */}
                <RocketSurface className="lg:col-span-2 p-4">
                    <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-4">
                        <Terminal className="w-4 h-4 text-orange-400" />
                        Command Console
                    </h3>

                    <div className="space-y-4">
                        {Object.entries(groupedCommands).map(([category, cmds]) => {
                            const cat = categoryLabels[category] || { label: category, color: 'text-white/50' };
                            return (
                                <div key={category}>
                                    <span className={cn('text-[11px] uppercase tracking-wider font-semibold mb-2 block', cat.color)}>
                                        {cat.label}
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2">
                                        {cmds.map(cmd => (
                                            <button
                                                key={cmd.id}
                                                onClick={() => requestCommand(cmd)}
                                                disabled={executingCmd !== null}
                                                className={cn(
                                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                                                    cmd.danger
                                                        ? 'bg-red-500/[0.03] border-red-500/10 hover:border-red-500/30 hover:bg-red-500/[0.06]'
                                                        : 'bg-white/[0.02] border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.04]',
                                                    executingCmd === cmd.id && 'border-orange-500/30 bg-orange-500/[0.05]',
                                                    executingCmd !== null && executingCmd !== cmd.id && 'opacity-40 cursor-not-allowed'
                                                )}
                                            >
                                                {executingCmd === cmd.id ? (
                                                    <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />
                                                ) : cmd.danger ? (
                                                    <AlertTriangle className="w-4 h-4 text-red-400/60 shrink-0" />
                                                ) : (
                                                    <Play className="w-3.5 h-3.5 text-white/30 shrink-0" />
                                                )}
                                                <div className="min-w-0">
                                                    <span className="text-sm text-white/70 block">{cmd.label}</span>
                                                    <span className="text-[10px] text-white/25 font-mono">{cmd.id}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Execution progress */}
                    {executingCmd && (
                        <div className="mt-4">
                            <ProgressBar
                                label={`Running: ${commands.find(c => c.id === executingCmd)?.label || executingCmd}`}
                                status="running"
                                showTimer
                            />
                        </div>
                    )}
                </RocketSurface>

                {/* Right column: Tunnels + Results */}
                <div className="space-y-4">
                    {/* Tunnel Management */}
                    <RocketSurface className="p-4">
                        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-3">
                            <ExternalLink className="w-4 h-4 text-cyan-400" />
                            Tunnel Management
                        </h3>

                        <div className="flex items-center gap-2 mb-3">
                            <RocketButton
                                variant="primary"
                                size="sm"
                                icon={tunnelAction === 'start' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                                onClick={() => requestTunnelAction('start')}
                                disabled={tunnelAction !== null}
                                className="flex-1"
                            >
                                Start Tunnels
                            </RocketButton>
                            <RocketButton
                                variant="danger"
                                size="sm"
                                icon={tunnelAction === 'stop' ? <Loader2 className="w-3 h-3 animate-spin" /> : <WifiOff className="w-3 h-3" />}
                                onClick={() => requestTunnelAction('stop')}
                                disabled={tunnelAction !== null}
                                className="flex-1"
                            >
                                Stop Tunnels
                            </RocketButton>
                        </div>

                        {activeTunnels > 0 ? (
                            <div className="space-y-1.5">
                                {Object.entries(tunnelUrls).map(([key, url]) => (
                                    <div key={key} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-cyan-500/20 transition-colors text-xs group">
                                        <StatusIndicator status="online" />
                                        <span className="text-white/50 capitalize min-w-0 truncate flex-1">{key}</span>
                                        <Tooltip content="Copy URL">
                                            <button onClick={() => copyTunnelUrl(url)} className="p-1 rounded text-white/15 hover:text-white/50 shrink-0">
                                                {copiedUrl === url ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </Tooltip>
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                            <ExternalLink className="w-3 h-3 text-white/15 hover:text-cyan-400" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-white/25 text-center py-3">No active tunnels</p>
                        )}
                    </RocketSurface>

                    {/* Command Results */}
                    <RocketSurface className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-orange-400" />
                                Results
                            </h3>
                            {commandResults.length > 0 && (
                                <button
                                    onClick={() => setCommandResults([])}
                                    className="text-[10px] text-white/25 hover:text-white/50 flex items-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" /> Clear
                                </button>
                            )}
                        </div>

                        {commandResults.length === 0 ? (
                            <div className="text-center py-6">
                                <Terminal className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                <p className="text-xs text-white/25">Run a command to see results</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                                {commandResults.map(result => (
                                    <div key={result.id}>
                                        <button
                                            onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                                            className="w-full text-left"
                                        >
                                            <OperationEntry
                                                label={result.label}
                                                status={result.status}
                                                detail={result.duration ? `${result.duration}ms` : undefined}
                                            />
                                        </button>
                                        {expandedResult === result.id && result.output && (
                                            <div className="mx-1 mt-1 mb-2 p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                                                <pre className="text-[11px] text-white/50 font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                                                    {result.output}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </RocketSurface>
                </div>
            </div>

            {/* ── Confirmation Modal ── */}
            <ConfirmModal
                open={confirmOpen}
                title={pendingAction?.label || 'Confirm Action'}
                message={
                    pendingAction?.type === 'service'
                        ? `Are you sure you want to ${pendingAction.action.replace('_', ' ')} ${pendingAction.target === '_all' ? 'all services' : pendingAction.target}? This will affect running processes.`
                        : pendingAction?.type === 'command'
                            ? `"${pendingAction.label}" is a dangerous operation. Are you sure you want to execute it?`
                            : `Are you sure you want to ${pendingAction?.action} all tunnels?`
                }
                danger
                confirmLabel="Execute"
                onConfirm={handleConfirm}
                onCancel={() => { setConfirmOpen(false); setPendingAction(null); }}
            />
        </div>
    );
}
