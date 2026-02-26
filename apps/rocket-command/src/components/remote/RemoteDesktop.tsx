'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
    Monitor, ExternalLink, Plus, Trash2, Clock, Globe,
    MousePointer, Keyboard, Laptop, Server, Smartphone,
    Star, StarOff, Copy, Check, Pencil, X, Wifi, WifiOff,
    RefreshCw, Shield, Zap, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { Tooltip } from '@/components/ui/Tooltip';

/* ── Types ── */
interface SavedDevice {
    id: string;
    name: string;
    url: string;
    icon: 'laptop' | 'server' | 'phone' | 'monitor';
    favorite: boolean;
    lastUsed?: number;
}

interface SessionLog {
    id: string;
    deviceName: string;
    url: string;
    openedAt: number;
}

const STORAGE_KEY = 'rc-remote-devices';
const SESSION_KEY = 'rc-remote-sessions';

/* ── Preset Quick Links ── */
const QUICK_LINKS = [
    {
        id: 'crd-access',
        label: 'My Computers',
        url: 'https://remotedesktop.google.com/access/',
        description: 'Access your registered Chrome Remote Desktop devices',
        icon: MousePointer,
        color: 'from-blue-500 to-blue-600',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/20 hover:border-blue-500/40',
        bgColor: 'bg-blue-500/[0.06] hover:bg-blue-500/[0.10]',
    },
    {
        id: 'crd-support',
        label: 'Remote Support',
        url: 'https://remotedesktop.google.com/support/',
        description: 'Generate a code to give or get remote assistance',
        icon: Keyboard,
        color: 'from-cyan-500 to-teal-500',
        textColor: 'text-cyan-400',
        borderColor: 'border-cyan-500/20 hover:border-cyan-500/40',
        bgColor: 'bg-cyan-500/[0.06] hover:bg-cyan-500/[0.10]',
    },
];

const DEVICE_ICONS = {
    laptop: Laptop,
    server: Server,
    phone: Smartphone,
    monitor: Monitor,
} as const;

/* ── Helpers ── */
function loadDevices(): SavedDevice[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveDevices(devices: SavedDevice[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
}
function loadSessions(): SessionLog[] {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'); } catch { return []; }
}
function saveSessions(sessions: SessionLog[]) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessions.slice(0, 20)));
}
function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

/* ════════════════════════════════════════════
   REMOTE DESKTOP — Popup Window Launcher
   ════════════════════════════════════════════ */
export default function RemoteDesktop() {
    const toast = useToast();
    const [devices, setDevices] = useState<SavedDevice[]>([]);
    const [sessions, setSessions] = useState<SessionLog[]>([]);
    const [showAddDevice, setShowAddDevice] = useState(false);
    const [editingDevice, setEditingDevice] = useState<SavedDevice | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formUrl, setFormUrl] = useState('');
    const [formIcon, setFormIcon] = useState<SavedDevice['icon']>('laptop');

    // Load from localStorage
    useEffect(() => {
        setDevices(loadDevices());
        setSessions(loadSessions());
    }, []);

    // ── Launch session in popup window ──
    const launchSession = useCallback((name: string, url: string) => {
        const width = Math.min(1400, window.screen.availWidth - 100);
        const height = Math.min(900, window.screen.availHeight - 100);
        const left = Math.round((window.screen.availWidth - width) / 2);
        const top = Math.round((window.screen.availHeight - height) / 2);

        const win = window.open(
            url,
            `remote-${Date.now()}`,
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes`
        );

        if (!win) {
            toast.warning('Popup blocked', 'Allow popups for this site, then try again.');
            return;
        }

        // Log session
        const session: SessionLog = {
            id: `s-${Date.now()}`,
            deviceName: name,
            url,
            openedAt: Date.now(),
        };
        const updated = [session, ...loadSessions()].slice(0, 20);
        saveSessions(updated);
        setSessions(updated);

        // Update last-used on matching saved device
        setDevices(prev => {
            const next = prev.map(d => d.url === url ? { ...d, lastUsed: Date.now() } : d);
            saveDevices(next);
            return next;
        });

        toast.success(`Launched ${name}`, 'Session opened in new window');
    }, [toast]);

    // ── Device CRUD ──
    const addDevice = useCallback(() => {
        if (!formName.trim() || !formUrl.trim()) return;
        const url = formUrl.trim().startsWith('http') ? formUrl.trim() : `https://${formUrl.trim()}`;
        const device: SavedDevice = {
            id: `d-${Date.now()}`,
            name: formName.trim(),
            url,
            icon: formIcon,
            favorite: false,
        };

        if (editingDevice) {
            setDevices(prev => {
                const next = prev.map(d => d.id === editingDevice.id ? { ...device, id: d.id, favorite: d.favorite, lastUsed: d.lastUsed } : d);
                saveDevices(next);
                return next;
            });
            toast.success('Device updated');
        } else {
            setDevices(prev => {
                const next = [...prev, device];
                saveDevices(next);
                return next;
            });
            toast.success('Device saved');
        }

        setFormName('');
        setFormUrl('');
        setFormIcon('laptop');
        setShowAddDevice(false);
        setEditingDevice(null);
    }, [formName, formUrl, formIcon, editingDevice, toast]);

    const removeDevice = useCallback((id: string) => {
        setDevices(prev => {
            const next = prev.filter(d => d.id !== id);
            saveDevices(next);
            return next;
        });
    }, []);

    const toggleFavorite = useCallback((id: string) => {
        setDevices(prev => {
            const next = prev.map(d => d.id === id ? { ...d, favorite: !d.favorite } : d);
            saveDevices(next);
            return next;
        });
    }, []);

    const startEdit = useCallback((device: SavedDevice) => {
        setEditingDevice(device);
        setFormName(device.name);
        setFormUrl(device.url);
        setFormIcon(device.icon);
        setShowAddDevice(true);
    }, []);

    const copyUrl = useCallback((url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        });
    }, []);

    const clearSessions = useCallback(() => {
        saveSessions([]);
        setSessions([]);
        toast.info('Session history cleared');
    }, [toast]);

    // Sort: favorites first, then by name
    const sortedDevices = [...devices].sort((a, b) => {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="flex flex-col bg-[#050510] overflow-y-auto" style={{ height: 'var(--content-height)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.06] bg-white/[0.01] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Monitor className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white leading-none">Remote Desktop</h1>
                        <p className="text-[11px] text-white/40 mt-0.5">Chrome Remote Desktop · Opens in new window</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {sessions.length > 0 && (
                        <span className="text-[10px] text-white/25 font-mono hidden sm:inline">
                            {sessions.length} session{sessions.length !== 1 ? 's' : ''} logged
                        </span>
                    )}
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15">
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <span className="text-[9px] font-bold text-emerald-400 hidden sm:inline">READY</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 md:px-6 py-5 space-y-6 max-w-5xl mx-auto w-full">

                {/* ── Quick Launch — Chrome Remote Desktop ── */}
                <section>
                    <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-blue-400/60" />
                        Chrome Remote Desktop
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {QUICK_LINKS.map(link => {
                            const Icon = link.icon;
                            return (
                                <button
                                    key={link.id}
                                    onClick={() => launchSession(link.label, link.url)}
                                    className={cn(
                                        'group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left',
                                        link.borderColor,
                                        link.bgColor
                                    )}
                                >
                                    <div className={cn(
                                        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                                        link.color
                                    )}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-white group-hover:text-white transition-colors flex items-center gap-2">
                                            {link.label}
                                            <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors" />
                                        </div>
                                        <div className="text-xs text-white/30 mt-0.5 line-clamp-1">{link.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ── Saved Devices ── */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                            <Laptop className="w-3.5 h-3.5 text-orange-400/60" />
                            Saved Devices
                        </h2>
                        <button
                            onClick={() => {
                                setEditingDevice(null);
                                setFormName('');
                                setFormUrl('');
                                setFormIcon('laptop');
                                setShowAddDevice(true);
                            }}
                            className="flex items-center gap-1 text-[11px] font-medium text-orange-400/70 hover:text-orange-400 transition-colors px-2 py-1 rounded-lg hover:bg-orange-500/[0.06]"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Device
                        </button>
                    </div>

                    {/* Add/Edit Form */}
                    {showAddDevice && (
                        <div className="mb-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-white/60">{editingDevice ? 'Edit Device' : 'Add New Device'}</span>
                                <button onClick={() => { setShowAddDevice(false); setEditingDevice(null); }} className="text-white/30 hover:text-white/60 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Device name (e.g. Home PC)"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 transition-colors"
                                    autoFocus
                                />
                                <input
                                    type="text"
                                    placeholder="URL or IP address"
                                    value={formUrl}
                                    onChange={e => setFormUrl(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addDevice()}
                                    className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 transition-colors"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-white/30 mr-1">Icon:</span>
                                    {(Object.keys(DEVICE_ICONS) as Array<SavedDevice['icon']>).map(key => {
                                        const DIcon = DEVICE_ICONS[key];
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setFormIcon(key)}
                                                className={cn(
                                                    'p-1.5 rounded-lg transition-all',
                                                    formIcon === key
                                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                        : 'text-white/25 hover:text-white/50 hover:bg-white/[0.04] border border-transparent'
                                                )}
                                            >
                                                <DIcon className="w-4 h-4" />
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={addDevice}
                                    disabled={!formName.trim() || !formUrl.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 text-sm font-medium hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    {editingDevice ? 'Save' : 'Add'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Device list */}
                    {sortedDevices.length === 0 && !showAddDevice ? (
                        <div className="text-center py-8 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
                            <Monitor className="w-8 h-8 text-white/10 mx-auto mb-2" />
                            <p className="text-xs text-white/25">No saved devices yet</p>
                            <p className="text-[10px] text-white/15 mt-0.5">Add devices for quick access to any remote URL</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sortedDevices.map(device => {
                                const DIcon = DEVICE_ICONS[device.icon];
                                return (
                                    <div
                                        key={device.id}
                                        className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.10] hover:bg-white/[0.04] transition-all duration-200"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                                            <DIcon className="w-5 h-5 text-white/40" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white/80 truncate">{device.name}</span>
                                                {device.favorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-white/25 font-mono truncate max-w-[200px]">{device.url}</span>
                                                {device.lastUsed && (
                                                    <span className="text-[9px] text-white/15 flex items-center gap-0.5 flex-shrink-0">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {timeAgo(device.lastUsed)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons — always visible on mobile, hover on desktop */}
                                        <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <Tooltip content={device.favorite ? 'Unfavorite' : 'Favorite'}>
                                                <button onClick={() => toggleFavorite(device.id)} className="p-1.5 rounded-lg text-white/25 hover:text-amber-400 hover:bg-amber-500/[0.08] transition-all">
                                                    {device.favorite ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Copy URL">
                                                <button onClick={() => copyUrl(device.url)} className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                                                    {copiedUrl === device.url ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Edit device">
                                                <button onClick={() => startEdit(device)} className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Remove device">
                                                <button onClick={() => removeDevice(device.id)} className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/[0.08] transition-all">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </Tooltip>
                                        </div>

                                        {/* Launch */}
                                        <button
                                            onClick={() => launchSession(device.name, device.url)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 text-blue-300 text-xs font-medium hover:bg-blue-500/25 transition-all flex-shrink-0"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Launch</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── Session History ── */}
                {sessions.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-violet-400/60" />
                                Recent Sessions
                            </h2>
                            <button
                                onClick={clearSessions}
                                className="text-[10px] text-white/25 hover:text-white/50 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="space-y-1">
                            {sessions.slice(0, 8).map(session => (
                                <div
                                    key={session.id}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.015] hover:bg-white/[0.03] transition-colors group"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400/40 flex-shrink-0" />
                                    <span className="text-xs text-white/50 flex-1 truncate">{session.deviceName}</span>
                                    <span className="text-[10px] text-white/20 font-mono flex-shrink-0">{timeAgo(session.openedAt)}</span>
                                    <button
                                        onClick={() => launchSession(session.deviceName, session.url)}
                                        className="text-[10px] text-blue-400/50 hover:text-blue-400 transition-colors sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1"
                                    >
                                        Relaunch
                                        <ExternalLink className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Tips ── */}
                <section className="pb-6">
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
                        <h3 className="text-xs font-semibold text-white/40 mb-2">Quick Tips</h3>
                        <ul className="space-y-1.5 text-[11px] text-white/25">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400/50 mt-0.5">&bull;</span>
                                Sessions open in a dedicated popup window &mdash; use F11 for fullscreen desktop-app feel
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400/50 mt-0.5">&bull;</span>
                                Save any remote URL (RDP web clients, VNC, SSH terminals) as a device for quick access
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400/50 mt-0.5">&bull;</span>
                                If popups are blocked, click the blocked-popup icon in your address bar to allow them
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400/50 mt-0.5">&bull;</span>
                                Star your most-used devices to pin them to the top of the list
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}
