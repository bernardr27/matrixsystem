'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { ProfileIcon } from '@/components/ui/ProfileIcons';
import { getAstraProfile, ZodiacSign } from '@/lib/astra';
import { useAccount } from '@/context/AccountContext';

const SIGN_DATES: Record<ZodiacSign, string> = {
    'Aries': 'Mar 21 - Apr 19', 'Taurus': 'Apr 20 - May 20', 'Gemini': 'May 21 - Jun 20',
    'Cancer': 'Jun 21 - Jul 22', 'Leo': 'Jul 23 - Aug 22', 'Virgo': 'Aug 23 - Sep 22',
    'Libra': 'Sep 23 - Oct 22', 'Scorpio': 'Oct 23 - Nov 21', 'Sagittarius': 'Nov 22 - Dec 21',
    'Capricorn': 'Dec 22 - Jan 19', 'Aquarius': 'Jan 20 - Feb 18', 'Pisces': 'Feb 19 - Mar 20'
};

export default function AstraCard() {
    const [sign, setSign] = useState<ZodiacSign | null>(null);
    const [loading, setLoading] = useState(true);
    const [forecast, setForecast] = useState('');
    const { archetype } = useAccount();
    const [isSimulated, setIsSimulated] = useState(false);

    useEffect(() => {
        const loadAstra = async () => {
            const profile = await getAstraProfile();
            if (profile) {
                setSign(profile.sign);
                // Try AI-powered forecast, fall back to template
                try {
                    const res = await fetch('/api/sage-chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: `Brief daily cosmic insight for ${profile.sign} focused on self-awareness. One sentence.` }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.response || data.content) {
                            setForecast(data.response || data.content);
                        } else {
                            throw new Error('no content');
                        }
                    } else {
                        throw new Error('api failed');
                    }
                } catch {
                    setIsSimulated(true);
                    setForecast(`The cosmic alignment suggests a focus on ${profile.sign}'s inherent strengths today. Channel your ${archetype?.name || 'energy'} to navigate the shifting tides.`);
                }
            }
            setLoading(false);
        };
        loadAstra();
    }, [archetype]);

    if (loading) return <NeuralSurface variant="glass" style={{ height: '300px' }}><div className="flex items-center justify-center h-full text-xs opacity-50 tracking-widest">CALIBRATING STARDUST...</div></NeuralSurface>;

    if (!sign) return (
        <NeuralSurface variant="glass" style={{ padding: '2rem', height: '100%' }}>
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="text-4xl opacity-20">✨</div>
                <h3 className="text-lg font-light tracking-widest text-white/70">ASTRA NOT LINKED</h3>
                <p className="text-xs text-white/40 max-w-[200px] leading-relaxed">
                    Initialize your origin data in settings to unlock cosmic insights.
                </p>
            </div>
        </NeuralSurface>
    );

    return (
        <NeuralSurface variant="glass" style={{ padding: '2rem', height: '100%', position: 'relative', overflow: 'hidden' }}>
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />

            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-light text-white tracking-wide">{sign.toUpperCase()}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{SIGN_DATES[sign]}</p>
                </div>
                <div className="text-4xl opacity-80" style={{ filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.5))' }}>
                    ✦
                </div>
            </div>

            <div className="relative z-10">
                <div className="text-[10px] uppercase tracking-widest text-purple-400 mb-3 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    Daily Cosmic Insight
                    {isSimulated && (
                        <span className="ml-2 px-2 py-0.5 rounded-full border border-purple-400/40 text-purple-200/80 bg-purple-500/10 text-[9px] tracking-[0.3em]">SIMULATED</span>
                    )}
                </div>

                {forecast ? (
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-sm leading-relaxed text-white/80 font-light italic"
                    >
                        "{forecast}"
                    </motion.p>
                ) : (
                    <div className="animate-pulse h-16 bg-white/5 rounded-lg w-full" />
                )}
            </div>

            <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-widest text-white/20">
                Astra Module v1.0
            </div>
        </NeuralSurface>
    );
}
