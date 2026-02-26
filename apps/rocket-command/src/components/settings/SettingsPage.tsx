'use client';

import React, { useState, useCallback } from 'react';
import {
    Settings, Palette, MessageSquare, Activity, Server, Bell,
    Globe, Code, RotateCcw, Download, Upload, Check, X,
    Rocket, Volume2, Eye, Gauge, Shield, Zap, Clock,
    MonitorSmartphone, Sparkles, ChevronRight, AlertTriangle
} from 'lucide-react';
import { useSettings, type RocketSettings } from '@/components/providers/SettingsProvider';
import { useRocket, useGlobalUptime } from '@/components/providers/RocketProvider';
import { RocketSurface, RocketButton } from '@/components/ui/RocketSurface';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   SETTINGS PAGE — RocketCommand Pro
   Full-featured settings panel with localStorage persistence
   ═══════════════════════════════════════════════════════ */

type SettingsSection = 'appearance' | 'chat' | 'telemetry' | 'services' | 'notifications' | 'tunnels' | 'data' | 'developer' | 'about';

const sections: { key: SettingsSection; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" />, desc: 'Visual style & layout' },
    { key: 'chat', label: 'AI Chat', icon: <MessageSquare className="w-4 h-4" />, desc: 'Agent defaults & TTS' },
    { key: 'telemetry', label: 'Telemetry', icon: <Activity className="w-4 h-4" />, desc: 'Polling & history' },
    { key: 'services', label: 'Services', icon: <Server className="w-4 h-4" />, desc: 'Fleet management' },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, desc: 'Alerts & sounds' },
    { key: 'tunnels', label: 'Tunnels', icon: <Globe className="w-4 h-4" />, desc: 'Remote access' },
    { key: 'data', label: 'Data', icon: <Shield className="w-4 h-4" />, desc: 'Storage & cleanup' },
    { key: 'developer', label: 'Developer', icon: <Code className="w-4 h-4" />, desc: 'Debug & logging' },
    { key: 'about', label: 'About', icon: <Rocket className="w-4 h-4" />, desc: 'System info' },
];

/* ── Reusable Setting Controls ── */

function SettingToggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-3 group">
            <div className="min-w-0 mr-4">
                <span className="text-sm text-white/80 block">{label}</span>
                {desc && <span className="text-xs text-white/30 block mt-0.5">{desc}</span>}
            </div>
            <button
                onClick={() => onChange(!value)}
                className={cn(
                    'relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0',
                    value ? 'bg-orange-500/80' : 'bg-white/[0.08]'
                )}
            >
                <div className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200',
                    value ? 'left-[22px]' : 'left-0.5'
                )} />
            </button>
        </div>
    );
}

function SettingSelect<T extends string>({ label, desc, value, options, onChange }: {
    label: string; desc?: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
    return (
        <div className="flex items-center justify-between py-3">
            <div className="min-w-0 mr-4">
                <span className="text-sm text-white/80 block">{label}</span>
                {desc && <span className="text-xs text-white/30 block mt-0.5">{desc}</span>}
            </div>
            <select
                value={value}
                onChange={e => onChange(e.target.value as T)}
                className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white/70 focus:outline-none focus:border-orange-500/30 appearance-none cursor-pointer min-w-[130px]"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#0c0c1d] text-white">{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

function SettingSlider({ label, desc, value, min, max, step, unit, onChange }: {
    label: string; desc?: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
    return (
        <div className="py-3">
            <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 mr-4">
                    <span className="text-sm text-white/80 block">{label}</span>
                    {desc && <span className="text-xs text-white/30 block mt-0.5">{desc}</span>}
                </div>
                <span className="text-sm font-mono text-orange-400 flex-shrink-0">{value}{unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/20">{min}{unit}</span>
                <span className="text-[10px] text-white/20">{max}{unit}</span>
            </div>
        </div>
    );
}

function Divider() {
    return <div className="border-t border-white/[0.04] my-1" />;
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                {icon}
            </div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   MAIN SETTINGS COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function SettingsPage() {
    const { settings, updateSetting, resetSettings, exportSettings, importSettings } = useSettings();
    const { services, cpu, memory, isConnected } = useRocket();
    const uptime = useGlobalUptime();
    const toast = useToast();
    const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
    const [confirmReset, setConfirmReset] = useState(false);
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [savedFlash, setSavedFlash] = useState(false);

    // Flash "saved" on any setting change
    const handleUpdate = useCallback(<K extends keyof RocketSettings>(key: K, value: RocketSettings[K]) => {
        updateSetting(key, value);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1200);
    }, [updateSetting]);

    const handleExport = useCallback(() => {
        const json = exportSettings();
        navigator.clipboard.writeText(json).then(() => {
            toast.success('Exported', 'Settings copied to clipboard');
        }).catch(() => {
            // Fallback: download as file
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'rocket-settings.json';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Exported', 'Settings downloaded as file');
        });
    }, [exportSettings, toast]);

    const handleImport = useCallback(() => {
        if (importSettings(importText)) {
            toast.success('Imported', 'Settings imported successfully');
            setShowImport(false);
            setImportText('');
        } else {
            toast.error('Invalid JSON', 'Could not parse settings data');
        }
    }, [importText, importSettings, toast]);

    const handleReset = useCallback(() => {
        resetSettings();
        setConfirmReset(false);
        toast.success('Reset', 'All settings reset to defaults');
    }, [resetSettings, toast]);

    const handleClearChatHistory = useCallback(() => {
        // Actually clear all chat localStorage keys
        localStorage.removeItem('rc-chat-antigravity');
        localStorage.removeItem('rc-chat-ghost');
        localStorage.removeItem('rc-chat-nexus');
        toast.success('Chat cleared', 'All chat history has been removed');
    }, [toast]);

    const handleClearUptime = useCallback(() => {
        localStorage.removeItem('rocket_uptime_start');
        toast.info('Uptime reset', 'Reload to apply');
    }, [toast]);

    const onlineCount = Object.values(services).filter(s => s === 'online').length;
    const totalCount = Object.keys(services).length;

    return (
        <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/15 flex items-center justify-center shadow-[0_0_20px_rgba(255,107,53,0.1)]">
                        <Settings className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
                            <span className="text-[9px] font-mono text-orange-400/50 bg-orange-500/5 px-1.5 py-0.5 rounded-md border border-orange-500/10">v3.0</span>
                            {savedFlash && (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                    <Check className="w-3 h-3" /> Saved
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-white/40">Configure RocketCommand Pro</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <RocketButton variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleExport}>
                        Export
                    </RocketButton>
                    <RocketButton variant="ghost" size="sm" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setShowImport(!showImport)}>
                        Import
                    </RocketButton>
                    <RocketButton variant="danger" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => setConfirmReset(true)}>
                        Reset
                    </RocketButton>
                </div>
            </div>

            {/* Import Panel */}
            {showImport && (
                <RocketSurface variant="neon" className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-orange-400" />
                        Import Settings JSON
                    </h3>
                    <textarea
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        placeholder='Paste your exported settings JSON here...'
                        rows={4}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 font-mono resize-none focus:outline-none focus:border-orange-500/30"
                    />
                    <div className="flex justify-end gap-2">
                        <RocketButton variant="ghost" size="sm" onClick={() => { setShowImport(false); setImportText(''); }}>Cancel</RocketButton>
                        <RocketButton variant="primary" size="sm" onClick={handleImport} disabled={!importText.trim()}>Apply</RocketButton>
                    </div>
                </RocketSurface>
            )}

            {/* Layout: Sidebar + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Sidebar */}
                <RocketSurface className="p-2 lg:col-span-1">
                    <div className="space-y-0.5">
                        {sections.map(section => {
                            const isActive = activeSection === section.key;
                            return (
                                <button
                                    key={section.key}
                                    onClick={() => setActiveSection(section.key)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200',
                                        isActive
                                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15'
                                            : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03]'
                                    )}
                                >
                                    <div className={cn('flex-shrink-0', isActive ? 'text-orange-400' : 'text-white/30')}>
                                        {section.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-sm font-medium block">{section.label}</span>
                                        <span className="text-[10px] text-white/25 block">{section.desc}</span>
                                    </div>
                                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-orange-400/50 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </RocketSurface>

                {/* Content */}
                <RocketSurface className="p-5 lg:col-span-3">
                    {/* ═══ APPEARANCE ═══ */}
                    {activeSection === 'appearance' && (
                        <div>
                            <SectionHeader icon={<Palette className="w-4 h-4" />} title="Appearance" />
                            <SettingSelect
                                label="Accent Color"
                                desc="Primary color used throughout the UI"
                                value={settings.accentColor}
                                options={[
                                    { value: 'orange', label: '🟠 Orange (Default)' },
                                    { value: 'cyan', label: '🔵 Cyan' },
                                    { value: 'violet', label: '🟣 Violet' },
                                    { value: 'emerald', label: '🟢 Emerald' },
                                    { value: 'rose', label: '🔴 Rose' },
                                ]}
                                onChange={v => handleUpdate('accentColor', v)}
                            />
                            <Divider />
                            <SettingToggle
                                label="Animations"
                                desc="Enable smooth transitions and hover effects"
                                value={settings.animationsEnabled}
                                onChange={v => handleUpdate('animationsEnabled', v)}
                            />
                            <Divider />
                            <SettingToggle
                                label="Compact Mode"
                                desc="Reduce padding and spacing for denser layouts"
                                value={settings.compactMode}
                                onChange={v => handleUpdate('compactMode', v)}
                            />
                            <Divider />
                            <SettingToggle
                                label="Show Boot Screen"
                                desc="Play the RocketCommand boot animation on launch"
                                value={settings.showBootScreen}
                                onChange={v => handleUpdate('showBootScreen', v)}
                            />
                        </div>
                    )}

                    {/* ═══ AI CHAT ═══ */}
                    {activeSection === 'chat' && (
                        <div>
                            <SectionHeader icon={<MessageSquare className="w-4 h-4" />} title="AI Chat" />
                            <SettingSelect
                                label="AI Provider"
                                desc="Choose which AI backend powers the chat"
                                value={settings.aiProvider}
                                options={[
                                    { value: 'groq', label: '⚡ Groq Cloud (LLaMA 3.3)' },
                                    { value: 'google', label: '🔮 Google Gemini' },
                                    { value: 'ollama', label: '🦙 Ollama Local' },
                                ]}
                                onChange={v => handleUpdate('aiProvider', v)}
                            />
                            <div className="py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04] mb-1">
                                <div className="flex items-start gap-2">
                                    <Zap className="w-3.5 h-3.5 text-orange-400/60 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-[11px] text-white/40 block">
                                            {settings.aiProvider === 'groq' && 'Add GROQ_API_KEY to .env.local — Free at console.groq.com/keys'}
                                            {settings.aiProvider === 'google' && 'Add GOOGLE_AI_KEY to .env.local — Free at aistudio.google.com/apikey'}
                                            {settings.aiProvider === 'ollama' && 'Run "ollama serve" locally — No API key needed. Free & private.'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Divider />
                            <SettingSelect
                                label="Default Agent"
                                desc="Which AI agent loads by default"
                                value={settings.defaultAgent}
                                options={[
                                    { value: 'antigravity', label: '🚀 Antigravity' },
                                    { value: 'ghost', label: '👻 Ghost' },
                                    { value: 'nexus', label: '🧠 Nexus' },
                                ]}
                                onChange={v => handleUpdate('defaultAgent', v)}
                            />
                            <Divider />
                            <SettingSelect
                                label="Chat Font Size"
                                desc="Text size in the chat interface"
                                value={settings.chatFontSize}
                                options={[
                                    { value: 'sm', label: 'Small' },
                                    { value: 'base', label: 'Medium' },
                                    { value: 'lg', label: 'Large' },
                                ]}
                                onChange={v => handleUpdate('chatFontSize', v)}
                            />
                            <Divider />
                            <SettingToggle
                                label="Text-to-Speech"
                                desc="Enable voice readout of AI responses"
                                value={settings.ttsEnabled}
                                onChange={v => handleUpdate('ttsEnabled', v)}
                            />
                            {settings.ttsEnabled && (
                                <>
                                    <SettingSlider
                                        label="Speech Rate"
                                        value={settings.ttsRate}
                                        min={0.5}
                                        max={2.0}
                                        step={0.05}
                                        unit="x"
                                        onChange={v => handleUpdate('ttsRate', v)}
                                    />
                                    <SettingSlider
                                        label="Speech Pitch"
                                        value={settings.ttsPitch}
                                        min={0.5}
                                        max={1.5}
                                        step={0.1}
                                        unit=""
                                        onChange={v => handleUpdate('ttsPitch', v)}
                                    />
                                </>
                            )}
                            <Divider />
                            <div className="py-3">
                                <RocketButton variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={handleClearChatHistory}>
                                    Clear Chat History
                                </RocketButton>
                                <span className="text-xs text-white/25 ml-3">Removes all saved conversations for all agents</span>
                            </div>
                        </div>
                    )}

                    {/* ═══ TELEMETRY ═══ */}
                    {activeSection === 'telemetry' && (
                        <div>
                            <SectionHeader icon={<Activity className="w-4 h-4" />} title="Telemetry" />
                            <SettingSlider
                                label="Polling Interval"
                                desc="How often to fetch live system metrics"
                                value={settings.pollingInterval}
                                min={5}
                                max={120}
                                step={5}
                                unit="s"
                                onChange={v => handleUpdate('pollingInterval', v)}
                            />
                            <Divider />
                            <SettingSlider
                                label="History Size"
                                desc="Maximum data points retained for charts"
                                value={settings.telemetryHistorySize}
                                min={10}
                                max={100}
                                step={5}
                                unit=" pts"
                                onChange={v => handleUpdate('telemetryHistorySize', v)}
                            />
                            <Divider />
                            <SettingToggle
                                label="Show Sparklines"
                                desc="Mini trend charts on stat cards"
                                value={settings.showSparklines}
                                onChange={v => handleUpdate('showSparklines', v)}
                            />
                            <Divider />
                            <div className="py-3">
                                <RocketButton variant="ghost" size="sm" icon={<Clock className="w-3.5 h-3.5" />} onClick={handleClearUptime}>
                                    Reset Uptime Counter
                                </RocketButton>
                                <span className="text-xs text-white/25 ml-3">Resets session uptime to 00:00:00</span>
                            </div>
                        </div>
                    )}

                    {/* ═══ SERVICES ═══ */}
                    {activeSection === 'services' && (
                        <div>
                            <SectionHeader icon={<Server className="w-4 h-4" />} title="Service Management" />
                            <SettingToggle
                                label="Confirm Dangerous Actions"
                                desc="Require confirmation before stopping or restarting services"
                                value={settings.confirmDangerousActions}
                                onChange={v => handleUpdate('confirmDangerousActions', v)}
                            />
                            <Divider />
                            <SettingToggle
                                label="Auto-Refresh Service Status"
                                desc="Periodically poll for service status changes"
                                value={settings.autoRefreshServices}
                                onChange={v => handleUpdate('autoRefreshServices', v)}
                            />
                            {settings.autoRefreshServices && (
                                <SettingSlider
                                    label="Refresh Rate"
                                    desc="How often to check service status"
                                    value={settings.serviceRefreshRate}
                                    min={5}
                                    max={60}
                                    step={5}
                                    unit="s"
                                    onChange={v => handleUpdate('serviceRefreshRate', v)}
                                />
                            )}
                            <Divider />
                            <div className="py-3">
                                <h4 className="text-sm text-white/60 mb-2">Current Fleet Status</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(services).map(([key, status]) => (
                                        <div key={key} className={cn(
                                            'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs',
                                            status === 'online' ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'
                                        )}>
                                            <div className={cn('w-2 h-2 rounded-full', status === 'online' ? 'bg-emerald-400' : 'bg-red-400')} />
                                            <span className="text-white/60 capitalize">{key}</span>
                                            <span className={cn('ml-auto font-mono', status === 'online' ? 'text-emerald-400' : 'text-red-400')}>{status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ NOTIFICATIONS ═══ */}
                    {activeSection === 'notifications' && (
                        <div>
                            <SectionHeader icon={<Bell className="w-4 h-4" />} title="Notifications" />
                            <SettingToggle
                                label="Service Down Alerts"
                                desc="Notify when a monitored service goes offline"
                                value={settings.notifyOnServiceDown}
                                onChange={v => handleUpdate('notifyOnServiceDown', v)}
                            />
                            <Divider />
                            <SettingToggle
                                label="Broadcast Notifications"
                                desc="Show alerts for incoming Supabase broadcasts"
                                value={settings.notifyOnBroadcast}
                                onChange={v => handleUpdate('notifyOnBroadcast', v)}
                            />
                            <Divider />
                            <SettingToggle
                                label="Sound Effects"
                                desc="Play audio cues for alerts and actions"
                                value={settings.soundEnabled}
                                onChange={v => handleUpdate('soundEnabled', v)}
                            />
                            <Divider />
                            <div className="py-3 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400/60 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-xs text-white/50 block">Browser notifications require permission.</span>
                                        <button
                                            onClick={() => {
                                                if ('Notification' in window) {
                                                    Notification.requestPermission().then(p => {
                                                        if (p === 'granted') toast.success('Enabled', 'Browser notifications enabled');
                                                        else toast.warning('Blocked', 'Notifications were denied');
                                                    });
                                                }
                                            }}
                                            className="text-xs text-orange-400 hover:text-orange-300 mt-1"
                                        >
                                            Request Permission →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ TUNNELS ═══ */}
                    {activeSection === 'tunnels' && (
                        <div>
                            <SectionHeader icon={<Globe className="w-4 h-4" />} title="Tunnel Settings" />
                            <SettingToggle
                                label="Auto-Refresh Tunnel URLs"
                                desc="Periodically check for active Cloudflare Quick Tunnels"
                                value={settings.tunnelAutoRefresh}
                                onChange={v => handleUpdate('tunnelAutoRefresh', v)}
                            />
                            <Divider />
                            <div className="py-3 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="flex items-start gap-2">
                                    <Globe className="w-4 h-4 text-cyan-400/60 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-xs text-white/50 block">Tunnels are managed from the Operations Center.</span>
                                        <span className="text-xs text-white/30 block mt-1">Start, stop, and view tunnel URLs from the Operations page → Tunnel Management section.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ DATA ═══ */}
                    {activeSection === 'data' && (
                        <div>
                            <SectionHeader icon={<Shield className="w-4 h-4" />} title="Data Management" />
                            <div className="space-y-3">
                                <div className="py-3">
                                    <h4 className="text-sm text-white/60 mb-3">Chat Storage</h4>
                                    <div className="space-y-2">
                                        {(['antigravity', 'ghost', 'nexus'] as const).map(agent => {
                                            const key = `rc-chat-${agent}`;
                                            const size = (() => { try { const d = localStorage.getItem(key); return d ? (new Blob([d]).size / 1024).toFixed(1) : '0'; } catch { return '0'; } })();
                                            const count = (() => { try { return JSON.parse(localStorage.getItem(key) || '[]').length; } catch { return 0; } })();
                                            return (
                                                <div key={agent} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-white/60 capitalize">{agent}</span>
                                                        <span className="text-[10px] text-white/25 font-mono">{count} msgs · {size}KB</span>
                                                    </div>
                                                    <RocketButton variant="ghost" size="sm" onClick={() => {
                                                        localStorage.removeItem(key);
                                                        toast.success('Cleared', `${agent} chat history removed`);
                                                    }}>
                                                        Clear
                                                    </RocketButton>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <Divider />
                                <div className="py-3">
                                    <h4 className="text-sm text-white/60 mb-3">Storage Overview</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: 'Settings', key: 'rocket_settings' },
                                            { label: 'Uptime', key: 'rocket_uptime_start' },
                                        ].map(item => {
                                            const size = (() => { try { const d = localStorage.getItem(item.key); return d ? `${(new Blob([d]).size / 1024).toFixed(1)}KB` : 'empty'; } catch { return 'n/a'; } })();
                                            return (
                                                <div key={item.key} className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                                    <span className="text-xs text-white/50 block">{item.label}</span>
                                                    <span className="text-[10px] text-white/25 font-mono">{size}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <Divider />
                                <div className="py-3">
                                    <RocketButton variant="danger" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />}
                                        onClick={() => {
                                            localStorage.removeItem('rc-chat-antigravity');
                                            localStorage.removeItem('rc-chat-ghost');
                                            localStorage.removeItem('rc-chat-nexus');
                                            localStorage.removeItem('rocket_uptime_start');
                                            toast.success('Cleared', 'All app data cleared');
                                        }}>
                                        Clear All App Data
                                    </RocketButton>
                                    <span className="text-xs text-white/25 ml-3">Removes chat history, uptime — preserves settings</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ DEVELOPER ═══ */}
                    {activeSection === 'developer' && (
                        <div>
                            <SectionHeader icon={<Code className="w-4 h-4" />} title="Developer" />
                            <SettingToggle
                                label="Debug Mode"
                                desc="Show extra diagnostic info in the console"
                                value={settings.debugMode}
                                onChange={v => handleUpdate('debugMode', v)}
                            />
                            <Divider />
                            <SettingToggle
                                label="Show API Latency"
                                desc="Display response times on service cards"
                                value={settings.showApiLatency}
                                onChange={v => handleUpdate('showApiLatency', v)}
                            />
                            <Divider />
                            <SettingToggle
                                label="Log Broadcasts"
                                desc="Print Supabase broadcast payloads to browser console"
                                value={settings.logBroadcasts}
                                onChange={v => handleUpdate('logBroadcasts', v)}
                            />
                            <Divider />
                            <div className="py-3">
                                <h4 className="text-sm text-white/60 mb-2">Environment</h4>
                                <div className="space-y-1.5">
                                    {[
                                        { label: 'Supabase', value: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Connected' : '✗ Not configured', ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
                                        { label: 'AI (Groq)', value: 'Server-side only', ok: true },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                            <span className="text-xs text-white/50">{item.label}</span>
                                            <span className={cn('text-xs font-mono', item.ok ? 'text-emerald-400' : 'text-red-400')}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ ABOUT ═══ */}
                    {activeSection === 'about' && (
                        <div>
                            <SectionHeader icon={<Rocket className="w-4 h-4" />} title="About RocketCommand Pro" />
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/10">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#ff9f1c] flex items-center justify-center shadow-lg shadow-orange-500/20">
                                        <Rocket className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-display font-bold text-white">RocketCommand Pro</h3>
                                        <p className="text-sm text-white/40">Operator Hub v3.0</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 2xl:grid-cols-4 gap-2">
                                    {[
                                        { label: 'Version', value: '3.0.0' },
                                        { label: 'Port', value: '4000' },
                                        { label: 'Framework', value: 'Next.js 16' },
                                        { label: 'Runtime', value: 'React 19' },
                                        { label: 'AI Engine', value: 'Groq · Gemini · Ollama' },
                                        { label: 'Backend', value: 'Supabase' },
                                        { label: 'Uptime', value: uptime },
                                        { label: 'Services', value: `${onlineCount}/${totalCount} online` },
                                        { label: 'CPU', value: `${cpu}%` },
                                        { label: 'Memory', value: `${memory}%` },
                                        { label: 'Supabase', value: isConnected ? 'Connected' : 'Disconnected' },
                                        { label: 'Build', value: 'Standalone' },
                                    ].map(item => (
                                        <div key={item.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                            <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">{item.label}</span>
                                            <span className="text-sm text-white/70 font-mono">{item.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-2">Pages</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                        {[
                                            { name: 'Launch Deck', path: '/' },
                                            { name: 'Antigravity Chat', path: '/chat' },
                                            { name: 'Mission Control', path: '/mission-control' },
                                            { name: 'Operations', path: '/operations' },
                                            { name: 'Telemetry', path: '/telemetry' },
                                            { name: 'Remote Desktop', path: '/remote-desktop' },
                                            { name: 'Settings', path: '/settings' },
                                        ].map(p => (
                                            <div key={p.path} className="flex items-center gap-1.5 text-xs text-white/40">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                <span>{p.name}</span>
                                                <span className="text-white/15 font-mono ml-auto">{p.path}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </RocketSurface>
            </div>

            {/* Confirm Reset Modal */}
            <ConfirmModal
                open={confirmReset}
                title="Reset All Settings"
                message="This will reset all settings back to their factory defaults. Your current preferences will be lost. This cannot be undone."
                danger
                confirmLabel="Reset Everything"
                onConfirm={handleReset}
                onCancel={() => setConfirmReset(false)}
            />
        </div>
    );
}
