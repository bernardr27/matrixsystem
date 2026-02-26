'use server';

import { reflectEngine } from '@/lib/ai/engine';
import { ReflectMode } from '@/lib/ai/types';
import { isSafeMode } from '@/lib/safe-mode';

export async function submitReflection(input: string, mode: ReflectMode) {
    // In a real app, verify user session here via Supabase
    // const supabase = await createServerClient();
    // const { data: { user } } = await supabase.auth.getUser();

    try {
        const { createClient } = await import('@/lib/supabase/server');
        const { getContext } = await import('@/lib/ai/rag');

        let context = "";
        if (!isSafeMode()) {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                context = await getContext(user.id, input);
            }
        }

        const reflection = await reflectEngine.generateReflection(
            input,
            mode,
            context ? [{ role: 'system', content: context }] : []
        );
        return { success: true, data: reflection };
    } catch (error) {
        return { success: false, error: 'Failed to generate reflection.' };
    }
}

export async function saveSession({
    mode,
    input,
    mirror,
    pattern,
    reframe,
    resolution,
}: {
    mode: ReflectMode;
    input: string;
    mirror: string;
    pattern: string;
    reframe: string;
    resolution: string;
}) {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Not signed in' };
        const { data: session, error } = await supabase.from('sessions').insert({
            user_id: user.id,
            mode,
            initial_input: input,
            mirror_text: mirror,
            pattern_text: pattern,
            reframe_question: reframe,
            user_resolution: resolution,
            completed_at: new Date().toISOString(),
        }).select('id').single();

        if (error) return { success: false, error: error.message };

        // --- TRIGGER NEURAL INDEXING (SAGE CORTEX) ---
        if (session) {
            await supabase.from('ghost_bridge').insert({
                command: `sage:embed ${session.id}|${input}`,
                status: 'pending'
            });
        }

        return { success: true, id: session?.id };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) || 'Unknown error' };
    }
}
export async function updateCognitionPoints(points: number) {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Not signed in' };

        const { data: profile } = await supabase.from('profiles').select('reflection_points').eq('id', user.id).single();
        const newPoints = (profile?.reflection_points || 0) + points;

        const { error } = await supabase.from('profiles').update({
            reflection_points: newPoints,
            // also tracking separate cognition points if we implement the col
        }).eq('id', user.id);

        if (error) return { success: false, error: error.message };
        return { success: true, points: newPoints };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) || 'Unknown error' };
    }
}
