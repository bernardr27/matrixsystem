'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield, CheckCircle2, XCircle, Radar, Server, Database,
    ShieldCheck, Fingerprint, Lock, Loader2, ArrowRight
} from 'lucide-react';
import { cn } from '@matrix-lib/utils';
import { createBrowserSupabaseClientFromEnv } from '@matrix-lib/supabase/next';

/* ═══════════════════════════════════════════════════════
   CITADEL LOGIN v1.0 — Premium secure login experience
   States: login → authenticating → booting → redirect
   Fallback: Local auth when Supabase is not configured
   ═══════════════════════════════════════════════════════ */

type Phase = 'login' | 'authenticating' | 'discord' | 'granted' | 'booting' | 'redirect';

interface BootStep {
    label: string;
    icon: React.ElementType;
    status: 'pending' | 'running' | 'done';
}

export default function LoginPage() {
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>('login');
    const [error, setError] = useState('');
    const [shaking, setShaking] = useState(false);
    const [discordCode, setDiscordCode] = useState('');
    const [useLocalAuth, setUseLocalAuth] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mounted, setMounted] = useState(false);
    const [tapCount, setTapCount] = useState(0);
    const [showOverride, setShowOverride] = useState(false);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Boot sequence state
    const [bootProgress, setBootProgress] = useState(0);
    const [bootSteps, setBootSteps] = useState<BootStep[]>([
        { label: 'Initializing Citadel core...', icon: Shield, status: 'pending' },
        { label: 'Verifying authentication...', icon: Fingerprint, status: 'pending' },
        { label: 'Scanning Matrix network...', icon: Radar, status: 'pending' },
        { label: 'Connecting to services...', icon: Server, status: 'pending' },
        { label: 'Loading app registry...', icon: Database, status: 'pending' },
        { label: 'Establishing secure channel...', icon: ShieldCheck, status: 'pending' },
    ]);

    // Check if Supabase is properly configured
    const isSupabaseConfigured = useCallback(() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        return url.trim().length > 0 && key.trim().length > 0 && !url.includes('placeholder') && key !== 'placeholder';
    }, []);

    // Focus username on mount & handle hydration
    useEffect(() => {
        setMounted(true);
        try {
            // Check if already authenticated via Supabase
            const supabase = createBrowserSupabaseClientFromEnv({
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            } as any as NodeJS.ProcessEnv);

            if (supabase && supabase.auth) {
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user) {
                        console.log('[Auth] User already authenticated:', user.id);
                        router.replace('/dashboard');
                    }
                }).catch(e => console.warn('[Auth] Check failed:', e));
            }
        } catch (e) {
            console.warn('[Auth] Initialization error (likely missing env vars):', e);
        }
    }, [router]);

    // ─── Login handler ───
    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[Login] Initiating login sequence. Phase:', phase, 'LocalAuth:', useLocalAuth);
        setError('');
        setPhase('authenticating');

        try {
            if (!isSupabaseConfigured() || useLocalAuth) {
                // Use local authentication
                const res = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'login', username, password }),
                    credentials: 'include',
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.error || 'Login failed');
                }

                // Create session and proceed to boot
                setPhase('granted');
                setTimeout(() => {
                    setPhase('booting');
                    runBootSequence();
                }, 1200);
            } else {
                // Use Supabase Discord OAuth with Timeout Fallback
                console.log('[Auth] Attempting Discord OAuth redirect...');
                const supabase = createBrowserSupabaseClientFromEnv({
                    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                } as any as NodeJS.ProcessEnv);

                const redirectUri = `${window.location.origin}/auth/callback?next=/dashboard`;
                console.log('[Auth] Redirect URI:', redirectUri);

                // Create a 5-second timeout promise
                const timeoutPromise = new Promise<{ error: Error }>((_, reject) => {
                    setTimeout(() => reject(new Error('Uplink timeout: OAuth provider unreachable')), 5000);
                });

                // Race the actual auth call against the timeout
                const { error } = await Promise.race([
                    supabase.auth.signInWithOAuth({
                        provider: 'discord',
                        options: { redirectTo: redirectUri }
                    }),
                    timeoutPromise
                ]) as { error: any };

                if (error) {
                    console.error('[Auth] OAuth Error:', error.message || error);
                    throw error;
                }
                console.log('[Auth] OAuth triggered successfully. Awaiting browser redirect...');
                // The browser will redirect to Discord. We leave it in 'authenticating' state.
            }
        } catch (err: any) {
            console.error('[Login] Exception:', err.message || err);
            setPhase('login');
            // If it was a timeout or connection issue on remote, suggest the manual override
            setError(err.message || 'Uplink Failed. Manual Override Recommended.');
            setUseLocalAuth(true); // Automatically reveal local auth fields as fallback
            setShowOverride(true);
            setShaking(true);
            setTimeout(() => setShaking(false), 600);
        }
    }, [useLocalAuth, username, password, isSupabaseConfigured, router, runBootSequence]);

    // ─── Secret Override Handler ───
    const handleTitleTap = useCallback(() => {
        if (showOverride) return;

        setTapCount(prev => {
            const next = prev + 1;
            console.log('[Override] Tap count:', next);

            if (next >= 7) {
                setShowOverride(true);
                // We don't force useLocalAuth here, we just show the toggle button
                console.log('[Override] Manual override unlocked.');
                return 0;
            }
            return next;
        });

        if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = setTimeout(() => {
            setTapCount(0);
        }, 2000); // 2 second window to complete 7 taps
    }, [showOverride]);
    const runBootSequence = useCallback(() => {
        const steps = [...bootSteps];
        let stepIndex = 0;
        const totalSteps = steps.length;

        const runStep = () => {
            if (stepIndex >= totalSteps) {
                setBootProgress(100);
                setTimeout(() => {
                    setPhase('redirect');
                    setTimeout(() => router.push('/dashboard'), 600);
                }, 500);
                return;
            }

            // Mark current step as running
            steps[stepIndex] = { ...steps[stepIndex], status: 'running' };
            setBootSteps([...steps]);
            setBootProgress(Math.round(((stepIndex + 0.5) / totalSteps) * 100));

            // Complete after delay
            const delay = 300 + Math.random() * 300;
            setTimeout(() => {
                steps[stepIndex] = { ...steps[stepIndex], status: 'done' };
                setBootSteps([...steps]);
                setBootProgress(Math.round(((stepIndex + 1) / totalSteps) * 100));
                stepIndex++;
                setTimeout(runStep, 100);
            }, delay);
        };

        setTimeout(runStep, 400);
    }, [bootSteps, router]);

    // ─── Discord Polling ───
    const pollDiscordVerification = useCallback((code: string) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'poll', code }),
                    credentials: 'include',
                });
                const data = await res.json();
                if (data.success) {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    setPhase('granted');
                    setTimeout(() => {
                        setPhase('booting');
                        runBootSequence();
                    }, 1200);
                }
            } catch (err) { }
        }, 2000);
    }, [runBootSequence]);

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    // ─── Keyboard shortcut ───
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && phase === 'login') {
                setError('');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [phase]);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#06060f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
            </div>
        );
    }

    // ═══════════════════════════════════════
    // RENDER: LOGIN PHASE
    // ═══════════════════════════════════════
    if (phase === 'login' || phase === 'authenticating' || phase === 'discord' || phase === 'granted') {
        return (
            <div className="h-screen w-screen flex items-center justify-center relative cosmic-void">
                {/* Subtle overlay grid */}
                <div className="fixed inset-0 cosmic-grid opacity-30 pointer-events-none" />

                {/* Floating animated orbs for depth */}
                <div className="fixed top-20 left-[10%] w-[30vw] h-[30vw] min-w-[300px] min-h-[300px] rounded-full bg-gold-500/5 blur-[120px] animate-abstract-float mix-blend-screen pointer-events-none" />
                <div className="fixed bottom-10 right-[15%] w-[40vw] h-[40vw] min-w-[400px] min-h-[400px] rounded-full bg-violet-500/10 blur-[150px] animate-abstract-float mix-blend-screen pointer-events-none" style={{ animationDelay: '-5s', animationDuration: '20s' }} />

                {/* Access Granted overlay */}
                {phase === 'granted' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
                        <div className="text-center animate-slide-up">
                            <CheckCircle2 className="w-20 h-20 text-gold-400 mx-auto mb-6 shield-glow" />
                            <h2 className="text-3xl font-display font-bold text-gold-400 tracking-[0.4em] uppercase">
                                Authorization Confirmed
                            </h2>
                            <p className="text-sm text-white/40 mt-3 font-mono">Initiating sovereign uplink...</p>
                        </div>
                    </div>
                )}

                {/* Login container */}
                <div className={cn(
                    'relative z-10 w-full max-w-[460px] mx-4',
                    shaking && 'shake'
                )}>
                    {/* Hero Icon */}
                    <div className="flex justify-center mb-10">
                        <div className="relative animate-slide-up">
                            <div className="w-24 h-24 rounded-2xl bg-black/40 border border-gold-500/20 flex items-center justify-center shadow-2xl relative z-10 backdrop-blur-xl">
                                <Shield className="w-12 h-12 text-gold-500 drop-shadow-[0_0_15px_rgba(212,168,67,0.4)]" strokeWidth={1.5} />
                            </div>
                            <div className="absolute -top-3 -right-3 bg-gold-500 text-black text-[10px] font-bold px-3 py-1 rounded-full z-20 shadow-[0_0_20px_rgba(212,168,67,0.4)] animate-pulse-gold font-mono uppercase tracking-widest">
                                OMEGA
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-10 select-none cursor-pointer active:scale-95 transition-transform" onClick={handleTitleTap}>
                        <h1 className="text-4xl font-display font-bold tracking-[0.3em] text-white uppercase mb-3 drop-shadow-lg">
                            Citadel
                        </h1>
                        <p className="text-xs tracking-[0.5em] text-gold-500/70 uppercase font-mono">
                            Sovereign OS · v3.0
                        </p>
                    </div>

                    {/* Main Form Panel */}
                    <div className="glass-panel-gold rounded-3xl p-8 space-y-6 min-h-[360px] flex flex-col justify-center relative overflow-hidden">
                        {/* Inner highlight */}
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                        {phase === 'discord' ? (
                            <div className="text-center space-y-6 animate-fade-in py-4 relative z-10">
                                <div className="space-y-3">
                                    <h3 className="text-xl font-display text-gold-400 tracking-widest uppercase font-bold">Identity Sync</h3>
                                    <p className="text-sm text-white/60 font-mono leading-relaxed max-w-[280px] mx-auto">
                                        Provide this key to the Citadel Discord Bot to verify your signature.
                                    </p>
                                </div>
                                <div className="bg-black/60 py-6 rounded-2xl border border-white/10 shadow-inner backdrop-blur-md">
                                    <span className="text-4xl font-mono tracking-[0.25em] text-white pl-2 font-bold drop-shadow-md">{discordCode}</span>
                                </div>
                                <div className="flex items-center justify-center gap-3 text-sm text-gold-400 font-mono animate-pulse drop-shadow">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Awaiting cryptosignature...
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 flex flex-col h-full justify-center">
                                {/* Error Box */}
                                {error && (
                                    <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in backdrop-blur-md">
                                        <XCircle className="w-5 h-5 shrink-0" />
                                        <span className="font-mono text-xs">{error}</span>
                                    </div>
                                )}

                                {/* Inputs (Local Override) */}
                                {useLocalAuth && (
                                    <div className="space-y-4 animate-fade-in mb-6">
                                        <label className="block">
                                            <span className="text-[11px] uppercase tracking-[0.2em] text-gold-400/80 font-display mb-2 block font-semibold pl-1">Identifier</span>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="root@matrix"
                                                className="w-full px-4 py-3 rounded-xl input-premium text-sm font-mono placeholder:text-white/20 relative z-20"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-[11px] uppercase tracking-[0.2em] text-gold-400/80 font-display mb-2 block font-semibold pl-1">Passphrase</span>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••••••"
                                                className="w-full px-4 py-3 rounded-xl input-premium text-sm font-mono placeholder:text-white/20 tracking-widest relative z-20"
                                            />
                                        </label>
                                        <p className="text-[10px] text-zinc-500 font-mono tracking-wider pl-1 mt-2">
                                            Default bypass: operator / citadel
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="mt-auto space-y-4 relative z-20">
                                    <button
                                        type="button"
                                        onClick={handleLogin}
                                        disabled={phase !== 'login'}
                                        style={{ pointerEvents: 'auto' }}
                                        className="btn-sovereign relative z-30 w-full py-4 rounded-xl text-sm font-display tracking-[0.2em] uppercase flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_20px_rgba(212,168,67,0.2)] hover:shadow-[0_0_30px_rgba(212,168,67,0.4)] transition-all cursor-pointer"
                                    >
                                        {phase === 'authenticating' ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Establishing Uplink
                                            </>
                                        ) : (useLocalAuth) ? (
                                            <>
                                                System Override
                                                <ArrowRight className="w-5 h-5 opacity-70" />
                                            </>
                                        ) : (
                                            <>
                                                Initialize Login Sequence
                                                <ArrowRight className="w-5 h-5 opacity-70" />
                                            </>
                                        )}
                                    </button>

                                    {!useLocalAuth && showOverride && (
                                        <button
                                            type="button"
                                            onClick={() => { setUseLocalAuth(true); setError(''); }}
                                            className="w-full py-3 text-[11px] text-white/40 hover:text-white transition-colors uppercase tracking-[0.15em] font-mono hover:bg-white/5 rounded-lg relative z-30 cursor-pointer"
                                        >
                                            Engage Manual Override
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Meta */}
                    <div className="text-center mt-10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Lock className="w-3 h-3 text-gold-500/50" />
                            <span className="text-[10px] text-gold-500/50 font-mono tracking-widest uppercase">
                                Unified Sovereign Architecture
                            </span>
                        </div>
                        <p className="text-[10px] text-white/20 font-mono tracking-wider">
                            MATRIX OS CORE · AGI COMMAND · V3.0
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════
    // RENDER: BOOT SEQUENCE
    // ═══════════════════════════════════════
    return (
        <div className={cn(
            'h-screen w-screen flex flex-col items-center justify-center cosmic-void transition-opacity duration-700',
            phase === 'redirect' && 'opacity-0 scale-105'
        )}>
            <div className="fixed inset-0 cosmic-grid opacity-20 pointer-events-none" />

            {/* Shield + Premium Progress ring */}
            <div className="relative mb-12 animate-fade-in drop-shadow-[0_0_30px_rgba(212,168,67,0.3)]">
                <svg width="140" height="140" viewBox="0 0 140 140" className="animate-spin-slow">
                    <circle
                        cx="70" cy="70" r="64"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="2"
                    />
                    <circle
                        cx="70" cy="70" r="64"
                        fill="none"
                        stroke="url(#goldGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 64}`}
                        strokeDashoffset={`${2 * Math.PI * 64 * (1 - bootProgress / 100)}`}
                        className="progress-ring-circle"
                    />
                    <defs>
                        <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#f5da8f" />
                            <stop offset="50%" stopColor="#d4a843" />
                            <stop offset="100%" stopColor="#8f6e21" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-md m-4 border border-gold-500/20">
                    <Shield className="w-10 h-10 text-gold-500 shield-glow" strokeWidth={1.5} />
                </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-display font-bold tracking-[0.4em] text-white uppercase mb-2 animate-fade-in z-10 drop-shadow-lg">
                Citadel OS
            </h1>
            <p className="text-[11px] font-mono text-gold-500/80 tracking-[0.3em] uppercase mb-10 animate-fade-in z-10 font-bold">
                System Ignition · {bootProgress}%
            </p>

            {/* Boot steps console */}
            <div className="w-full max-w-[400px] mx-4 space-y-2 z-10 glass-panel p-4 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                {bootSteps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                        <div
                            key={i}
                            className={cn(
                                'flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-500 ease-out',
                                step.status === 'done' && 'opacity-40 translate-x-2',
                                step.status === 'running' && 'bg-gold-500/10 border border-gold-500/20 translate-x-1 shadow-[0_0_15px_rgba(212,168,67,0.1)]',
                                step.status === 'pending' && 'opacity-20 scale-95',
                            )}
                        >
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                {step.status === 'done' ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                ) : step.status === 'running' ? (
                                    <Loader2 className="w-5 h-5 text-gold-500 animate-spin drop-shadow-[0_0_5px_rgba(212,168,67,0.5)]" />
                                ) : (
                                    <Icon className="w-5 h-5 text-zinc-600" />
                                )}
                            </div>
                            <span className={cn(
                                'text-[13px] font-mono tracking-wide',
                                step.status === 'running' ? 'text-gold-100 font-bold' : 'text-zinc-400',
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Progress bar line */}
            <div className="w-full max-w-[400px] mx-4 mt-8 z-10">
                <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-gold-700 via-gold-400 to-gold-300 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(212,168,67,0.5)]"
                        style={{ width: `${bootProgress}%` }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 flex items-center gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] text-white/30 font-mono tracking-[0.2em] z-10 uppercase">
                    Securing Quantum Link
                </p>
            </div>
        </div>
    );
}

