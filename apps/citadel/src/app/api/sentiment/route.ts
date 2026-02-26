import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@matrix-lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        // Fetch recent sessions with metadata
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select('emotion, mood_score, created_at')
            .is('is_trashed', false)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({
                averageMood: 0.5,
                dominantEmotion: 'neutral',
                systemResonance: 0.5,
                emotionDistribution: {},
                lastUpdate: new Date().toISOString()
            });
        }

        // Calculations
        const totalMood = sessions.reduce((acc, s) => acc + (s.mood_score || 0.5), 0);
        const avgMood = totalMood / sessions.length;

        const distribution: Record<string, number> = {};
        sessions.forEach(s => {
            const emotion = s.emotion || 'neutral';
            distribution[emotion] = (distribution[emotion] || 0) + 1;
        });

        const dominant = Object.entries(distribution).sort((a, b) => b[1] - a[1])[0][0];

        // System Resonance: Higher if mood is stable and high
        const variance = sessions.reduce((acc, s) => acc + Math.pow((s.mood_score || 0.5) - avgMood, 2), 0) / sessions.length;
        const resonance = Math.max(0, Math.min(1, avgMood * (1 - Math.sqrt(variance))));

        return NextResponse.json({
            averageMood: avgMood,
            dominantEmotion: dominant,
            systemResonance: resonance,
            emotionDistribution: distribution,
            count: sessions.length,
            lastUpdate: sessions[0].created_at
        });

    } catch (err: any) {
        console.error('[SENTIMENT_API_ERROR]', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
