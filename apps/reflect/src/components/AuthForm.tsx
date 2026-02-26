'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';

import { NeuralSurface } from './ui/NeuralSurface';
import { NeuralButton } from './ui/NeuralButton';
import { ProfileIcon } from './ui/ProfileIcons';

// Input styles as inline to bypass globals.css !important overrides
const inputStyle: React.CSSProperties = {
    width: '100%',
    display: 'block',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '14px 18px',
    fontSize: '0.95rem',
    color: '#ffffff',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
};

export default function AuthForm({ onboardingData }: { onboardingData?: any }) {
    const [keepSignedIn, setKeepSignedIn] = useState(true);
    const [showSignupConfirm, setShowSignupConfirm] = useState(false);

    // Auth State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isSignup, setIsSignup] = useState(!!onboardingData);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [existingUser, setExistingUser] = useState<any>(null);

    // Recovery State
    const [forgotMode, setForgotMode] = useState<'off' | 'request' | 'verify' | 'reset'>('off');
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [recoveryQuestion, setRecoveryQuestion] = useState('');
    const [recoveryAnswer, setRecoveryAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [recoveryUserId, setRecoveryUserId] = useState('');

    // Dev/Safe Mode
    const [tapCount, setTapCount] = useState(0);
    const [devModeUnlocked, setDevModeUnlocked] = useState(false);
    const [showDevConfirm, setShowDevConfirm] = useState(false);

    const router = useRouter();
    const { addToast } = useNotifications();

    // Persist 'Keep Me Signed In'
    useEffect(() => {
        const stored = localStorage.getItem('reflect_keep_signed_in');
        if (stored !== null) setKeepSignedIn(stored === 'true');

        // Check for existing session (to fix "bugged" setup loop)
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
            if (user) {
                setExistingUser(user);
                setIsSignup(true); // Force "Setup" mode but logically it's an update
                if (onboardingData?.name) setUsername(onboardingData.name);
            }
        });
    }, [onboardingData]);

    const toggleKeepSignedIn = (checked: boolean) => {
        setKeepSignedIn(checked);
        localStorage.setItem('reflect_keep_signed_in', String(checked));
    };

    const handleDevTap = () => {
        if (devModeUnlocked) return;
        const newCount = tapCount + 1;
        setTapCount(newCount);
        if (newCount >= 7) {
            setShowDevConfirm(true);
            setTapCount(0);
        }
    };

    const questions = [
        "What was the name of your first pet?",
        "What city were you born in?",
        "What was your first car?",
        "What is your mother's maiden name?",
        "What was the name of your elementary school?"
    ];

    const captureAuthError = (action: 'signup' | 'login', error: any, email: string) => {
        if (!error) return;
        const details = {
            action,
            message: error?.message || 'Unknown auth error',
            email,
            time: new Date().toISOString()
        };
        try { localStorage.setItem('reflect.authError', JSON.stringify(details)); } catch { }
        return details;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const supabase = createClient();
        const authIdentifier = username.trim();

        if (!authIdentifier) {
            setMessage("Error: Identification required.");
            setLoading(false);
            return;
        }

        // === SCENARIO A: SIGNUP / COMPLETE ONBOARDING ===
        if (isSignup) {
            // Validation (skip password check if existing user)
            if (!existingUser) {
                if (password !== confirmPassword) {
                    setMessage("Error: Passwords do not match.");
                    setLoading(false);
                    return;
                }
            }
            if (!securityQuestion || !securityAnswer) {
                setMessage("Error: Recovery data required.");
                setLoading(false);
                return;
            }

            let userId = existingUser?.id;
            let finalEmail = existingUser?.email;

            // If NOT existing user, create account
            if (!userId) {
                const generatedEmail = `${authIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '.')}@reflect.internal`;
                finalEmail = generatedEmail;

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: generatedEmail,
                    password,
                    options: {
                        data: {
                            email: generatedEmail,
                            username: authIdentifier,
                            ...onboardingData?.astra // Inject Birth Date/Time into User Metadata
                        }
                    }
                });

                if (authError) {
                    const details = captureAuthError('signup', authError, generatedEmail);
                    setMessage(`Error: ${details?.message}`);
                    setLoading(false);
                    return;
                }
                userId = authData.user!.id;
            }

            // Upsert Profile (works for both new and existing)
            const profilePayload: any = {
                id: userId,
                username: authIdentifier,
                email: finalEmail,
                security_question: securityQuestion,
                security_answer_hash: securityAnswer.trim(),
                onboarding_complete: true,
                tier: onboardingData?.tier || 'Essence',
                avatar_url: onboardingData?.archetypeData?.id || 'seeker',
                archetype: onboardingData?.archetypeData || null
            };

            const { error: profileError } = await supabase.from('profiles').upsert(profilePayload);

            if (profileError) {
                setMessage(`Profile Error: ${profileError.message}`);
            } else {
                setMessage("Cognition anchored. Initializing...");
                localStorage.setItem('reflect_new_account', '1');
                setTimeout(() => window.location.href = '/tutorial', 1000);
            }

        }
        // === SCENARIO B: LOGIN ===
        else {
            let targetEmail = authIdentifier.includes('@') ? authIdentifier : `${authIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '.')}@reflect.internal`;

            try {
                const res = await fetch('/api/auth/resolve-username', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: authIdentifier })
                });
                const data = await res.json();
                if (data.email) targetEmail = data.email;
            } catch (err) { }

            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: targetEmail,
                password
            });

            if (loginError) {
                const details = captureAuthError('login', loginError, targetEmail);
                setMessage(`Error: ${details?.message}`);
            } else {
                addToast('System Link Established', 'success');
                window.location.href = '/session';
            }
        }
        setLoading(false);
    };

    return (
        <div className="w-full flex flex-col gap-4 sm:gap-6">
            {/* Archetype Display (if onboarding) */}
            {onboardingData && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-2"
                >
                    <div className="filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        <ProfileIcon 
                            type={onboardingData.archetypeData?.icon || 'seeker'} 
                            color={onboardingData.archetypeData?.color || '#fff'} 
                            active={true} 
                            size={48} 
                        />
                    </div>
                    <span className="text-[0.65rem] sm:text-[0.75rem] tracking-widest opacity-50 font-mono">
                        RESONANCE: {onboardingData.archetypeData?.name?.toUpperCase()}
                    </span>
                </motion.div>
            )}

            {/* ERROR/SUCCESS MESSAGE */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={handleDevTap}
                        className={`text-center text-xs sm:text-sm font-mono p-3 sm:p-4 rounded-xl cursor-pointer transition-all ${
                            message.startsWith('Error')
                                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                : 'bg-green-500/10 border border-green-500/30 text-green-400'
                        }`}
                    >
                        {message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AUTH FORM */}
            <form onSubmit={handleAuth} className="flex flex-col gap-3 sm:gap-4">
                {/* Username/Email Input */}
                <motion.input
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm sm:text-base transition-all focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
                />

                {/* Password Input (if not existing user or login) */}
                {!existingUser && (
                    <motion.input
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm sm:text-base transition-all focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                )}

                {/* Confirm Password (if signup) */}
                {isSignup && !existingUser && (
                    <motion.input
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm sm:text-base transition-all focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                )}

                {/* Security Question (if signup) */}
                {isSignup && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="p-4 sm:p-5 bg-white/3 border border-white/10 rounded-xl space-y-3"
                    >
                        <div className="text-xs sm:text-xs tracking-widest uppercase font-semibold text-white/40">
                            Security Anchor
                        </div>
                        <select
                            value={securityQuestion}
                            onChange={(e) => setSecurityQuestion(e.target.value)}
                            required
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm transition-all focus:border-white/30 focus:outline-none"
                        >
                            <option value="">Select Question...</option>
                            {questions.map((q, i) => <option key={i} value={q}>{q}</option>)}
                        </select>
                        <input
                            type="text"
                            placeholder="Your Answer"
                            value={securityAnswer}
                            onChange={(e) => setSecurityAnswer(e.target.value)}
                            required
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm transition-all focus:border-white/30 focus:outline-none"
                        />
                    </motion.div>
                )}

                {/* Login Options */}
                {!isSignup && !existingUser && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3 mt-2"
                    >
                        {/* Keep Signed In */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 transition-all flex items-center justify-center ${
                                keepSignedIn 
                                    ? 'bg-blue-500/80 border-blue-500' 
                                    : 'border-white/20 group-hover:border-white/40'
                            }`}>
                                {keepSignedIn && (
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <input 
                                type="checkbox" 
                                checked={keepSignedIn} 
                                onChange={(e) => toggleKeepSignedIn(e.target.checked)} 
                                className="hidden" 
                            />
                            <span className="text-xs sm:text-sm text-white/40 tracking-wide font-semibold uppercase">
                                Keep Me Signed In
                            </span>
                        </label>

                        {/* Forgot Password */}
                        <button
                            type="button"
                            onClick={() => setForgotMode('request')}
                            className="text-xs sm:text-sm text-white/40 hover:text-white/60 transition-colors tracking-wide font-semibold uppercase w-full text-left"
                        >
                            Forgot Password?
                        </button>
                    </motion.div>
                )}

                {/* Submit Button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: isSignup ? 0.35 : 0.25 }}
                    className="mt-2"
                >
                    <NeuralButton 
                        type="submit" 
                        isLoading={loading} 
                        className="w-full" 
                        glow={!isSignup}
                    >
                        {isSignup 
                            ? (existingUser ? 'FINALIZE PROFILE' : 'INITIALIZE SYSTEM') 
                            : 'ESTABLISH LINK'
                        }
                    </NeuralButton>
                </motion.div>
            </form>

            {/* Toggle Auth Mode */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: isSignup ? 0.4 : 0.3 }}
                className="text-center pt-4 border-t border-white/5"
            >
                <button
                    onClick={() => setIsSignup(!isSignup)}
                    className="text-xs sm:text-sm text-white/40 hover:text-white/70 transition-colors tracking-wide font-semibold uppercase"
                >
                    {existingUser 
                        ? "Update Profile" 
                        : (isSignup 
                            ? "Back to Login" 
                            : "New User? Initialize"
                        )
                    }
                </button>
            </motion.div>

            {/* Developer Mode Badge */}
            <AnimatePresence>
                {devModeUnlocked && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed top-4 right-4 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono"
                    >
                        SAFE_MODE
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
