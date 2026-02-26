'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/context/AccountContext';
import styles from './loading.module.css';

// --- STYLES ---
// Use inline styles or create a module. Let's use inline for simplicity in this generated file.
// Or we can reuse initialize.module.css if we import it, but cleaner to be standalone.

export default function DashboardLoadingPage() {
    const router = useRouter();
    const { archetype, tier, insights, setInsights } = useAccount();
    const [statusIndex, setStatusIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const STATUS_MESSAGES = [
        "ESTABLISHING CORTEX LINK...",
        `ANCHORING IDENTITY: ${archetype?.name?.toUpperCase() || 'UNKNOWN'}`,
        `SYNCHRONIZING LAYER: ${tier?.toUpperCase() || 'ESSENCE'}`,
        "COMPILING NEURAL PATHWAYS...",
        "DECRYPTING SOUL STREAM...",
        "INITIALIZING SHADOW MIRROR...",
        "SYSTEM READY."
    ];

    useEffect(() => {
        // Fetch Insights if new account
        const isNewAccount = localStorage.getItem('reflect_new_account');

        if (isNewAccount && archetype && !insights) {
            fetch('/api/insights/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: localStorage.getItem('reflect_username') || 'Unknown Seeker',
                    archetype,
                    tier: tier || 'Essence',
                    calibrationSnippet: localStorage.getItem('reflect_calibration_snippet') || ''
                })
            }).then(res => res.json()).then(data => {
                if (data.insights) setInsights(data.insights);
            }).catch(console.error);
        }

        const totalDuration = 4500; // 4.5s total load
        const intervalTime = 50;
        const steps = totalDuration / intervalTime;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const pct = Math.min(100, (currentStep / steps) * 100);
            setProgress(pct);

            // Update status text
            const statusStage = Math.floor((pct / 100) * (STATUS_MESSAGES.length - 1));
            setStatusIndex(statusStage);

            if (currentStep >= steps) {
                clearInterval(timer);
                // Clear the new account flag so Session doesn't play its own loader
                localStorage.removeItem('reflect_new_account');
                setTimeout(() => router.push('/session'), 800);
            }
        }, intervalTime);

        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'monospace',
            zIndex: 9999
        }}>
            {/* Background Pulse */}
            <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                    position: 'absolute',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${archetype?.color || '#3b82f6'}20 0%, transparent 70%)`,
                    filter: 'blur(80px)'
                }}
            />

            <div style={{ position: 'relative', width: '300px', textAlign: 'center' }}>
                {/* Central Loader Ring */}
                <div style={{
                    position: 'relative', width: '100px', height: '100px', margin: '0 auto 3rem auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                        style={{
                            position: 'absolute', inset: 0,
                            border: '2px solid rgba(255,255,255,0.1)',
                            borderTopColor: archetype?.color || '#fff',
                            borderRadius: '50%'
                        }}
                    />
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                            width: '40px', height: '40px',
                            background: archetype?.color || '#fff',
                            borderRadius: '50%',
                            boxShadow: `0 0 30px ${archetype?.color || '#fff'}`
                        }}
                    />
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div
                        style={{ width: `${progress}%`, height: '100%', background: archetype?.color || '#fff', boxShadow: `0 0 10px ${archetype?.color || '#fff'}` }}
                    />
                </div>

                {/* Status Text (Glitchy typewriter?) */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={statusIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            fontSize: '0.75rem',
                            letterSpacing: '0.2em',
                            color: 'rgba(255,255,255,0.7)',
                            fontWeight: 900
                        }}
                    >
                        {STATUS_MESSAGES[statusIndex]}
                    </motion.div>
                </AnimatePresence>

                {/* Percentage */}
                <div style={{
                    marginTop: '1rem',
                    fontSize: '2rem',
                    fontWeight: 100,
                    color: 'rgba(255,255,255,0.2)'
                }}>
                    {Math.floor(progress)}%
                </div>
            </div>
        </div>
    );
}
