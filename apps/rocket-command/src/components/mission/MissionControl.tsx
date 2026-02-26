'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Target, Plus, Rocket, Clock, CheckCircle, XCircle, AlertTriangle,
    Play, Pause, Trash2, RefreshCw, ChevronDown, Zap, Flag,
    Sparkles, Loader2, CheckSquare, Square, Edit3, Lightbulb, TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRocket } from '@/components/providers/RocketProvider';
import { RocketSurface, RocketButton } from '@/components/ui/RocketSurface';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

type MissionStatus = 'queued' | 'executing' | 'completed' | 'failed' | 'paused';
type Priority = 'low' | 'normal' | 'high' | 'critical';

interface Mission {
    id: string;
    title: string;
    description: string;
    status: MissionStatus;
    priority: Priority;
    created_at: string;
    updated_at: string;
    source: string;
}

const statusConfig: Record<MissionStatus, { icon: React.ReactNode; color: string; bg: string }> = {
    queued: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-white/50', bg: 'bg-white/[0.06]' },
    executing: { icon: <Zap className="w-3.5 h-3.5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]' },
    completed: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
    failed: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-400', bg: 'bg-red-500/10 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' },
    paused: { icon: <Pause className="w-3.5 h-3.5" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
};

const priorityConfig: Record<Priority, { label: string; color: string; dot: string }> = {
    low: { label: 'Low', color: 'text-white/40', dot: 'bg-white/30' },
    normal: { label: 'Normal', color: 'text-blue-400', dot: 'bg-blue-400' },
    high: { label: 'High', color: 'text-orange-400', dot: 'bg-orange-400' },
    critical: { label: 'Critical', color: 'text-red-400', dot: 'bg-red-400' },
};

export default function MissionControl() {
    const toast = useToast();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPriority, setNewPriority] = useState<Priority>('normal');
    const [titleError, setTitleError] = useState(false);
    const [filter, setFilter] = useState<MissionStatus | 'all'>('all');
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showAiGenerate, setShowAiGenerate] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDesc, setEditDesc] = useState('');
    const [suggestedMissions, setSuggestedMissions] = useState<{ title: string; description: string; priority: Priority }[]>([]);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { services } = useRocket();

    const fetchMissions = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('matrix_missions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data && !error) {
                setMissions(data as Mission[]);
                setLoadError(false);
            } else if (error) {
                setLoadError(true);
            }
        } catch {
            setLoadError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMissions();

        // Realtime subscription
        const channel = supabase
            .channel('rocket_missions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matrix_missions' }, () => {
                fetchMissions();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchMissions]);

    const createMission = async () => {
        if (!newTitle.trim()) {
            setTitleError(true);
            toast.warning('Title required', 'Please enter a mission title');
            return;
        }
        setTitleError(false);
        setCreating(true);

        const mission = {
            title: newTitle.trim(),
            description: newDesc.trim(),
            priority: newPriority,
            status: 'queued',
            source: 'rocket-command',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        try {
            const { error } = await supabase.from('matrix_missions').insert(mission);
            if (error) {
                toast.error('Deploy failed', error.message);
            } else {
                toast.success('Mission deployed', `"${newTitle.trim()}" is now queued`);
                setNewTitle('');
                setNewDesc('');
                setNewPriority('normal');
                setShowCreate(false);
                fetchMissions();
            }
        } catch (err) {
            toast.error('Deploy failed', String(err));
        } finally {
            setCreating(false);
        }
    };

    const updateStatus = async (id: string, status: MissionStatus) => {
        setActioningId(id);
        try {
            const { error } = await supabase.from('matrix_missions').update({
                status,
                updated_at: new Date().toISOString()
            }).eq('id', id);
            if (error) {
                toast.error('Update failed', error.message);
            } else {
                toast.success('Status updated', `Mission set to ${status}`);
                fetchMissions();
            }
        } catch (err) {
            toast.error('Update failed', String(err));
        } finally {
            setActioningId(null);
        }
    };

    const requestDelete = (id: string, title: string) => {
        setConfirmDelete({ id, title });
    };

    const confirmDeleteMission = async () => {
        if (!confirmDelete) return;
        setActioningId(confirmDelete.id);
        try {
            const { error } = await supabase.from('matrix_missions').delete().eq('id', confirmDelete.id);
            if (error) {
                toast.error('Delete failed', error.message);
            } else {
                toast.success('Mission deleted', `"${confirmDelete.title}" has been removed`);
                fetchMissions();
            }
        } catch (err) {
            toast.error('Delete failed', String(err));
        } finally {
            setActioningId(null);
            setConfirmDelete(null);
        }
    };

    /* ── AI Mission Generation ── */
    const generateMission = async () => {
        if (!aiPrompt.trim()) return;
        setAiGenerating(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are a mission planning AI. Given a user description, generate a mission. Respond ONLY in this exact JSON format, no other text: {"title": "short title", "description": "detailed description", "priority": "low|normal|high|critical"}' },
                        { role: 'user', content: aiPrompt },
                    ],
                    context: { services, agent: 'nexus' },
                }),
            });
            const data = await res.json();
            const content = data.content || '';
            // Parse JSON from AI response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const mission = {
                    title: parsed.title || aiPrompt.substring(0, 80),
                    description: parsed.description || aiPrompt,
                    priority: ['low', 'normal', 'high', 'critical'].includes(parsed.priority) ? parsed.priority : 'normal',
                    status: 'queued',
                    source: 'ai-generated',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                const { error } = await supabase.from('matrix_missions').insert(mission);
                if (error) throw error;
                toast.success('AI mission deployed', `"${mission.title}" created by AI`);
                setAiPrompt('');
                setShowAiGenerate(false);
                fetchMissions();
            } else {
                throw new Error('AI did not return valid JSON');
            }
        } catch (err) {
            toast.error('Generation failed', err instanceof Error ? err.message : 'Check Groq API key');
        } finally {
            setAiGenerating(false);
        }
    };

    /* ── Batch Operations ── */
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const batchUpdateStatus = async (status: MissionStatus) => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        try {
            const { error } = await supabase.from('matrix_missions').update({
                status,
                updated_at: new Date().toISOString(),
            }).in('id', ids);
            if (error) throw error;
            toast.success('Batch updated', `${ids.length} missions set to ${status}`);
            setSelectedIds(new Set());
            fetchMissions();
        } catch (err) {
            toast.error('Batch update failed', String(err));
        }
    };

    const updateDescription = async (id: string) => {
        try {
            const { error } = await supabase.from('matrix_missions').update({
                description: editDesc,
                updated_at: new Date().toISOString(),
            }).eq('id', id);
            if (error) throw error;
            toast.success('Updated', 'Description saved');
            setEditingId(null);
            fetchMissions();
        } catch {
            toast.error('Update failed', 'Could not save description');
        }
    };

    /* ── AI Suggested Missions ── */
    const fetchSuggestions = useCallback(async () => {
        setSuggestLoading(true);
        try {
            const onlineServices = Object.entries(services).filter(([, s]) => s === 'online').map(([k]) => k);
            const offlineServices = Object.entries(services).filter(([, s]) => s !== 'online').map(([k]) => k);
            const existingTitles = missions.slice(0, 10).map(m => m.title).join(', ');
            const exec = missions.filter(m => m.status === 'executing').length;
            const fail = missions.filter(m => m.status === 'failed').length;
            const queue = missions.filter(m => m.status === 'queued').length;

            const systemCtx = `Online: ${onlineServices.join(', ') || 'none'}. Offline: ${offlineServices.join(', ') || 'none'}. Active missions: ${exec}. Failed: ${fail}. Queued: ${queue}. Existing: ${existingTitles || 'none'}`;

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: `You are a mission planning AI. Based on the current system state, suggest 3 actionable missions. Consider: offline services need restarts, high failure rates need investigation, performance optimization, security audits, backups, documentation. Respond ONLY with a JSON array of 3 objects: [{"title":"short title","description":"detailed description","priority":"low|normal|high|critical"}]. No other text.` },
                        { role: 'user', content: `Current system state: ${systemCtx}` },
                    ],
                    context: { services, agent: 'nexus' },
                }),
            });
            const data = await res.json();
            const content = data.content || '';
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                setSuggestedMissions(parsed.slice(0, 3).map((m: any) => ({
                    title: m.title || 'Untitled',
                    description: m.description || '',
                    priority: ['low', 'normal', 'high', 'critical'].includes(m.priority) ? m.priority : 'normal',
                })));
                setShowSuggestions(true);
            }
        } catch (err) {
            toast.error('Suggestions failed', 'Could not generate — check AI');
        }
        setSuggestLoading(false);
    }, [services, missions, toast]);

    const deploySuggestion = async (suggestion: { title: string; description: string; priority: Priority }) => {
        try {
            const { error } = await supabase.from('matrix_missions').insert({
                title: suggestion.title,
                description: suggestion.description,
                priority: suggestion.priority,
                status: 'queued',
                source: 'ai-suggested',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            if (error) throw error;
            toast.success('Mission deployed', `"${suggestion.title}" queued`);
            setSuggestedMissions(prev => prev.filter(s => s.title !== suggestion.title));
            fetchMissions();
        } catch {
            toast.error('Deploy failed', 'Could not create mission');
        }
    };

    const filteredMissions = filter === 'all' ? missions : missions.filter(m => m.status === filter);

    const counts = {
        all: missions.length,
        queued: missions.filter(m => m.status === 'queued').length,
        executing: missions.filter(m => m.status === 'executing').length,
        completed: missions.filter(m => m.status === 'completed').length,
        failed: missions.filter(m => m.status === 'failed').length,
        paused: missions.filter(m => m.status === 'paused').length,
    };

    return (
        <div className="p-4 md:p-6 xl:p-8 max-w-[1920px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 squircle bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/15 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                        <Target className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-display font-bold text-white">Mission Control</h1>
                            <span className="text-[9px] font-mono text-cyan-400/50 bg-cyan-500/5 px-1.5 py-0.5 rounded-md border border-cyan-500/10">v3.0</span>
                        </div>
                        <p className="text-sm text-white/40">{counts.executing} active \xb7 {counts.queued} queued \xb7 {counts.completed} done</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <RocketButton variant="ghost" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchMissions}>
                        Refresh
                    </RocketButton>
                    <RocketButton variant="ghost" size="sm"
                        icon={suggestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                        onClick={fetchSuggestions}
                        disabled={suggestLoading}
                        className={showSuggestions ? 'text-amber-400 border-amber-500/20' : ''}>
                        Suggest
                    </RocketButton>
                    <RocketButton variant="ghost" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}
                        onClick={() => { setShowAiGenerate(!showAiGenerate); setShowCreate(false); }}
                        className={showAiGenerate ? 'text-violet-400 border-violet-500/20' : ''}>
                        AI Generate
                    </RocketButton>
                    <RocketButton variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => { setShowCreate(!showCreate); setShowAiGenerate(false); }}>
                        New Mission
                    </RocketButton>
                </div>
            </div>

            {/* Create Mission Panel */}
            {showCreate && (
                <RocketSurface variant="neon" className="p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
                    <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                        <div className="w-6 h-6 squircle bg-orange-500/10 flex items-center justify-center">
                            <Rocket className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        Launch New Mission
                    </h3>
                    <div>
                        <input
                            value={newTitle}
                            onChange={e => { setNewTitle(e.target.value); if (e.target.value.trim()) setTitleError(false); }}
                            placeholder="Mission title..."
                            maxLength={100}
                            className={cn(
                                'w-full bg-white/[0.04] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/30',
                                titleError ? 'border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.15)]' : 'border-white/[0.08]'
                            )}
                        />
                        <div className="flex justify-between mt-1">
                            {titleError && <span className="text-[10px] text-red-400">Title is required</span>}
                            <span className={cn('text-[10px] ml-auto', newTitle.length > 90 ? 'text-amber-400' : 'text-white/20')}>{newTitle.length}/100</span>
                        </div>
                    </div>
                    <textarea
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                        placeholder="Mission description (optional)..."
                        rows={2}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-orange-500/30"
                    />
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-white/40">Priority:</span>
                        {(Object.keys(priorityConfig) as Priority[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setNewPriority(p)}
                                className={cn(
                                    'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                                    newPriority === p
                                        ? `${priorityConfig[p].color} bg-white/[0.08] border border-white/20`
                                        : 'text-white/30 hover:text-white/50'
                                )}
                            >
                                {priorityConfig[p].label}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2">
                        <RocketButton variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</RocketButton>
                        <RocketButton variant="primary" size="sm" onClick={createMission} disabled={!newTitle.trim() || creating}
                            icon={creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}>
                            {creating ? 'Deploying...' : 'Deploy Mission'}
                        </RocketButton>
                    </div>
                </RocketSurface>
            )}

            {/* AI Generate Mission Panel */}
            {showAiGenerate && (
                <RocketSurface variant="neon" className="p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
                    <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                        <div className="w-6 h-6 squircle bg-violet-500/10 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        </div>
                        AI Mission Generator
                        <span className="text-[9px] font-mono text-violet-400/40 bg-violet-500/5 px-1.5 py-0.5 rounded-md">Groq</span>
                    </h3>
                    <p className="text-xs text-white/35">Describe what you need and AI will generate title, description, and priority automatically.</p>
                    <textarea
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="e.g. Set up CI/CD pipeline for the Matrix apps with automated testing and deploy to production..."
                        rows={3}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-violet-500/30"
                    />
                    <div className="flex justify-end gap-2">
                        <RocketButton variant="ghost" size="sm" onClick={() => setShowAiGenerate(false)}>Cancel</RocketButton>
                        <RocketButton variant="primary" size="sm" onClick={generateMission} disabled={!aiPrompt.trim() || aiGenerating}
                            icon={aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}>
                            {aiGenerating ? 'Generating...' : 'Generate & Deploy'}
                        </RocketButton>
                    </div>
                </RocketSurface>
            )}

            {/* AI Suggested Missions */}
            {showSuggestions && suggestedMissions.length > 0 && (
                <RocketSurface variant="neon" className="p-5 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                            <div className="w-6 h-6 squircle bg-amber-500/10 flex items-center justify-center">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                            Recommended Missions
                            <span className="text-[9px] font-mono text-amber-400/40 bg-amber-500/5 px-1.5 py-0.5 rounded-md">AI</span>
                        </h3>
                        <button onClick={() => setShowSuggestions(false)} className="text-[10px] text-white/25 hover:text-white/50">Dismiss</button>
                    </div>
                    <p className="text-xs text-white/30">Based on your current system state and active services</p>
                    <div className="space-y-2">
                        {suggestedMissions.map((s, i) => {
                            const pc = priorityConfig[s.priority as Priority] || priorityConfig.normal;
                            return (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/15 transition-all">
                                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', pc.dot)} />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm text-white/80 font-medium">{s.title}</h4>
                                        <p className="text-xs text-white/35 mt-0.5 line-clamp-2">{s.description}</p>
                                        <span className={cn('text-[10px] font-medium mt-1 inline-block', pc.color)}>{pc.label} priority</span>
                                    </div>
                                    <RocketButton variant="ghost" size="sm" onClick={() => deploySuggestion(s)}
                                        icon={<Rocket className="w-3 h-3" />} className="flex-shrink-0">
                                        Deploy
                                    </RocketButton>
                                </div>
                            );
                        })}
                    </div>
                </RocketSurface>
            )}

            {/* Batch Actions Bar */}
            {selectedIds.size > 0 && (
                <RocketSurface className="p-3 flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-white/50">{selectedIds.size} selected</span>
                    <div className="flex items-center gap-1">
                        <RocketButton variant="ghost" size="sm" onClick={() => batchUpdateStatus('executing')} icon={<Play className="w-3 h-3" />}>Execute</RocketButton>
                        <RocketButton variant="ghost" size="sm" onClick={() => batchUpdateStatus('completed')} icon={<CheckCircle className="w-3 h-3" />}>Complete</RocketButton>
                        <RocketButton variant="ghost" size="sm" onClick={() => batchUpdateStatus('paused')} icon={<Pause className="w-3 h-3" />}>Pause</RocketButton>
                    </div>
                    <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-[10px] text-white/30 hover:text-white/60">Clear selection</button>
                </RocketSurface>
            )}

            <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 overflow-x-auto border border-white/[0.04]">
                {(['all', 'queued', 'executing', 'completed', 'failed', 'paused'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                            filter === f
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                : 'text-white/40 hover:text-white/60'
                        )}
                    >
                        {f !== 'all' && statusConfig[f].icon}
                        <span className="capitalize">{f}</span>
                        <span className="text-[10px] text-white/25">
                            {counts[f as keyof typeof counts] ?? 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* Load Error */}
            {loadError && (
                <RocketSurface variant="flame" className="p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm text-white/70">Unable to connect to mission database</p>
                        <p className="text-xs text-white/35 mt-0.5">Supabase may be unavailable or the <code className="text-amber-400/60">matrix_missions</code> table may not exist. Missions will load when connection is restored.</p>
                    </div>
                    <RocketButton variant="ghost" size="sm" onClick={() => { setIsLoading(true); setLoadError(false); fetchMissions(); }} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                        Retry
                    </RocketButton>
                </RocketSurface>
            )}

            {/* Missions List */}
            <div className="space-y-2">
                {isLoading ? (
                    <div className="space-y-2 stagger-children">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse border border-white/[0.04]" />
                        ))}
                    </div>
                ) : filteredMissions.length === 0 ? (
                    <RocketSurface className="p-16 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/10 mx-auto mb-4 flex items-center justify-center animate-float">
                            <Target className="w-7 h-7 text-white/15" />
                        </div>
                        <p className="text-sm text-white/30 mb-1">
                            {filter === 'all' ? 'No missions deployed yet.' : `No ${filter} missions.`}
                        </p>
                        <p className="text-xs text-white/15">{filter === 'all' ? 'Launch your first mission above to get started.' : 'Try a different filter.'}</p>
                    </RocketSurface>
                ) : (<div className="space-y-2 stagger-children">
                    {filteredMissions.map(mission => {
                        const sc = statusConfig[mission.status];
                        const pc = priorityConfig[mission.priority as Priority] || priorityConfig.normal;
                        const statusBorder = mission.status === 'executing' ? 'border-l-cyan-400' : mission.status === 'completed' ? 'border-l-emerald-400' : mission.status === 'failed' ? 'border-l-red-400' : mission.status === 'paused' ? 'border-l-amber-400' : 'border-l-white/10';
                        return (
                            <RocketSurface key={mission.id} hover className={cn('p-4 border-l-2 holo-card', statusBorder)}>
                                <div className="flex items-start gap-3">
                                    {/* Batch select */}
                                    <button onClick={() => toggleSelect(mission.id)} className="mt-1 flex-shrink-0 text-white/20 hover:text-white/50">
                                        {selectedIds.has(mission.id) ? <CheckSquare className="w-4 h-4 text-orange-400" /> : <Square className="w-4 h-4" />}
                                    </button>

                                    {/* Priority dot */}
                                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', pc.dot)} />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="text-sm font-medium text-white/80 truncate">{mission.title}</h4>
                                            <div className={cn('flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md transition-all', sc.bg, sc.color)}>
                                                {sc.icon}
                                                <span className="capitalize">{mission.status}</span>
                                            </div>
                                        </div>
                                        {mission.description && (
                                            editingId === mission.id ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                                                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500/30"
                                                        onKeyDown={e => { if (e.key === 'Enter') updateDescription(mission.id); if (e.key === 'Escape') setEditingId(null); }}
                                                        autoFocus />
                                                    <RocketButton variant="ghost" size="sm" onClick={() => updateDescription(mission.id)}>Save</RocketButton>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 group">
                                                    <p className="text-xs text-white/35 truncate">{mission.description}</p>
                                                    <button onClick={() => { setEditingId(mission.id); setEditDesc(mission.description || ''); }}
                                                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/50 transition-all">
                                                        <Edit3 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )
                                        )}
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[10px] text-white/20 font-mono">
                                                {new Date(mission.created_at).toLocaleString()}
                                            </span>
                                            {mission.source && (
                                                <span className="text-[10px] text-white/15 px-1.5 py-0.5 bg-white/[0.03] rounded">
                                                    {mission.source}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {actioningId === mission.id ? (
                                            <div className="p-1.5"><RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" /></div>
                                        ) : (
                                            <>
                                                {mission.status === 'queued' && (
                                                    <button onClick={() => updateStatus(mission.id, 'executing')} className="p-1.5 rounded-lg text-cyan-400/60 hover:text-cyan-400 hover:bg-white/[0.04]" title="Execute">
                                                        <Play className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {mission.status === 'executing' && (
                                                    <>
                                                        <button onClick={() => updateStatus(mission.id, 'paused')} className="p-1.5 rounded-lg text-amber-400/60 hover:text-amber-400 hover:bg-white/[0.04]" title="Pause">
                                                            <Pause className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => updateStatus(mission.id, 'completed')} className="p-1.5 rounded-lg text-emerald-400/60 hover:text-emerald-400 hover:bg-white/[0.04]" title="Complete">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                                {mission.status === 'paused' && (
                                                    <button onClick={() => updateStatus(mission.id, 'executing')} className="p-1.5 rounded-lg text-cyan-400/60 hover:text-cyan-400 hover:bg-white/[0.04]" title="Resume">
                                                        <Play className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button onClick={() => requestDelete(mission.id, mission.title)} className="p-1.5 rounded-lg text-red-400/30 hover:text-red-400 hover:bg-white/[0.04]" title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </RocketSurface>
                        );
                    })}
                </div>)}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={!!confirmDelete}
                title="Delete Mission"
                message={`Are you sure you want to delete "${confirmDelete?.title}"? This action cannot be undone.`}
                danger
                confirmLabel="Delete"
                loading={actioningId === confirmDelete?.id}
                onConfirm={confirmDeleteMission}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
}
