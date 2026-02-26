'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { NeuralSurface } from '../ui/NeuralSurface';

export default function DashboardHero() {
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({
        days: 0,
        archetype: '—',
        patterns: 0
    });
    const supabase = createClient();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
            if (data) {
                setProfile(data);
                setStats(prev => ({
                    ...prev,
                    archetype: data.archetype || data.display_name || '—',
                }));
            }

            // Compute streak from real sessions
            const { count } = await supabase
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            if (count !== null) {
                setStats(prev => ({ ...prev, days: count }));
            }
        };
        fetchProfile();
    }, [supabase]);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div
            style={{
                width: '100%',
                maxWidth: '1300px',
                padding: '0 2rem 2rem 2rem',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginBottom: '0',
                boxSizing: 'border-box',
                flexWrap: 'wrap',
                gap: '2rem'
            }}
        >
            <div style={{ flex: 1, minWidth: '300px' }}>
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 100, letterSpacing: '-0.04em', margin: 0, color: 'var(--foreground)', lineHeight: 1 }}
                >
                    {greeting()}, <span style={{ fontWeight: 300, color: 'var(--accent)' }}>{profile?.display_name || 'Seeker'}</span>.
                </motion.h1>
                <p style={{ fontSize: '0.7rem', color: 'var(--foreground)', opacity: 0.15, fontWeight: 900, marginTop: '0.8rem', letterSpacing: '0.4em' }}>
                    REFLECT_ENGINE // ACTIVE_CONSCIOUSNESS
                </p>
            </div>

            <div style={{ display: 'flex', gap: '3rem', flexShrink: 0 }}>
                {[
                    { label: 'ARCHETYPE', value: stats.archetype, color: 'var(--accent)' },
                    { label: 'STREAK', value: `${stats.days} DAYS`, color: 'var(--foreground)' }
                ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--foreground)', opacity: 0.1, letterSpacing: '0.2em', marginBottom: '0.4rem' }}>{s.label}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 300, color: s.color, opacity: 0.7, letterSpacing: '0.05em' }}>{s.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
