'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSafeMode } from '@/lib/safe-mode';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { biofeedbackManager } from '@/lib/affective/biofeedback';
import { ReflectMode } from '@/lib/ai/types';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { Loader2, Volume2, Mic, Activity, Brain, Radio, Wifi } from 'lucide-react';

function NotificationControl() {
    const { permission, requestPermission, sendNotification } = useNotifications();

    return (
        <NeuralSurface variant="glass" className="p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white uppercase tracking-wider">Synaptic Pings</span>
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    permission === 'granted' ? 'text-emerald-400' : 'text-slate-600'
                )}>
                    {permission === 'granted' ? 'LINKED' : permission === 'denied' ? 'BLOCKED' : 'OFFLINE'}
                </span>
            </div>

            {permission !== 'granted' ? (
                <button
                    type="button"
                    onClick={requestPermission}
                    className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                    ESTABLISH LINK
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => sendNotification('Reflect', 'Neural synchronization check.')}
                    className="w-full py-3 bg-transparent border border-white/5 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:text-white transition-all"
                >
                    TEST SIGNAL
                </button>
            )}
        </NeuralSurface>
    );
}

const MODES: ReflectMode[] = ['mindset', 'career', 'money', 'relationships', 'discipline'];

export default function ProfileForm() {
    const [mode, setMode] = useState<ReflectMode>('mindset');
    const [isDaily, setIsDaily] = useState(false);
    const [isVoice, setIsVoice] = useState(false);
    const [isAmbient, setIsAmbient] = useState(true);
    const [isCanvas, setIsCanvas] = useState(true);
    const [tier, setTier] = useState('Seed');
    const [points, setPoints] = useState(0);
    const [tone, setTone] = useState('Neutral');
    const [aiProvider, setAiProvider] = useState('openai');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        async function loadProfile() {
            if (isSafeMode()) {
                setLoading(false);
                return;
            }

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    if (data.default_mode) setMode(data.default_mode as ReflectMode);
                    if (data.daily_prompt) setIsDaily(data.daily_prompt);
                    if (data.tier) setTier(data.tier);
                    if (data.reflection_points) setPoints(data.reflection_points);
                    if (data.preferred_tone) setTone(data.preferred_tone);
                    if (data.voice_enabled !== undefined) setIsVoice(data.voice_enabled);
                    if (data.ambient_enabled !== undefined) setIsAmbient(data.ambient_enabled);
                    if (data.canvas_enabled !== undefined) setIsCanvas(data.canvas_enabled);
                    if (data.ai_provider) setAiProvider(data.ai_provider);
                }
            }
            setLoading(false);
        }
        loadProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        if (isSafeMode()) {
            setTimeout(() => {
                setSaving(false);
                setMessage("[Safe Mode] Saved locally.");
            }, 800);
            return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setMessage("Error: Not logged in.");
            setSaving(false);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                default_mode: mode,
                daily_prompt: isDaily,
                preferred_tone: tone,
                voice_enabled: isVoice,
                ambient_enabled: isAmbient,
                canvas_enabled: isCanvas,
                ai_provider: aiProvider,
            })
            .eq('id', user.id);

        if (error) {
            setMessage("Error: " + error.message);
        } else {
            setMessage("Preferences synced.");
        }
        setSaving(false);
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-white/20" /></div>;

    return (
        <div className="w-full flex flex-col gap-8 pb-24">

            {/* Neural Identity Card */}
            <NeuralSurface variant="glass" className="p-8 text-center relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="text-5xl mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform duration-500 group-hover:scale-110">
                        {tier === 'Singularity' ? '🌀' : tier === 'Bloom' ? '🌸' : '🌱'}
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">{tier}</h2>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">
                        {points} SYNAPTIC_POINTS
                    </div>
                </div>
                <div
                    className="absolute bottom-0 left-0 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-1000"
                    style={{ width: `${Math.min(100, (points % 100))}%` }}
                />
            </NeuralSurface>

            <form onSubmit={handleSave} className="flex flex-col gap-6">

                {/* Matrix Controls */}
                <NeuralSurface variant="glass" className="p-6 flex flex-col gap-6">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Sensory Input</div>

                    <div className="grid grid-cols-2 gap-4">
                        <ToggleCard icon={Mic} label="Voice" active={isVoice} onClick={() => setIsVoice(!isVoice)} />
                        <ToggleCard icon={Volume2} label="Ambient" active={isAmbient} onClick={() => setIsAmbient(!isAmbient)} />
                        <ToggleCard icon={Activity} label="Canvas" active={isCanvas} onClick={() => setIsCanvas(!isCanvas)} />
                        <ToggleCard icon={Radio} label="Daily" active={isDaily} onClick={() => setIsDaily(!isDaily)} />
                    </div>
                </NeuralSurface>

                {/* Default Mode */}
                <NeuralSurface variant="glass" className="p-6">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Primary Protocol</div>
                    <div className="flex flex-col gap-3">
                        {MODES.map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                className={cn(
                                    "w-full p-4 rounded-xl border transition-all duration-300 flex justify-between items-center group/btn",
                                    mode === m
                                        ? "bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                        : "bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300"
                                )}
                            >
                                <span className="text-xs font-black uppercase tracking-widest italic">{m}</span>
                                {mode === m && (
                                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white] animate-pulse" />
                                )}
                            </button>
                        ))}
                    </div>
                </NeuralSurface>

                {/* AI Core */}
                <NeuralSurface variant="glass" className="p-6">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Neural Core</div>
                    <div className="flex gap-4">
                        {['openai', 'local'].map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setAiProvider(p)}
                                className={cn(
                                    "flex-1 p-6 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-3",
                                    aiProvider === p
                                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                                        : "bg-white/[0.02] border-white/5 text-slate-600 grayscale opacity-40 hover:grayscale-0 hover:opacity-100"
                                )}
                            >
                                <Brain size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{p === 'openai' ? 'Cloud' : 'Local'}</span>
                            </button>
                        ))}
                    </div>
                </NeuralSurface>

                <NotificationControl />

                <button
                    type="submit"
                    disabled={saving}
                    className={cn(
                        "w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] italic transition-all duration-500",
                        saving ? "opacity-50 scale-95 cursor-not-allowed" : "hover:bg-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] active:scale-95"
                    )}
                >
                    {saving ? 'SYNCING...' : 'SAVE_CONFIGURATION'}
                </button>
            </form>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "text-center p-4 rounded-xl text-[10px] font-black uppercase tracking-widest italic",
                        message.startsWith('Error')
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    )}
                >
                    {message}
                </motion.div>
            )}
        </div>
    );
}

function ToggleCard({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "aspect-square p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-500",
                active
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                    : "bg-white/[0.02] border-white/5 text-slate-600 hover:border-white/10"
            )}
        >
            <Icon size={20} className={cn("transition-colors", active ? "text-cyan-400" : "text-slate-600")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", active ? "text-white" : "text-slate-600")}>
                {label}
            </span>
        </button>
    )
}
