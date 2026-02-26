'use server';

import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';
import { MOCK_HISTORY } from '@/lib/debug/mocks';
import { ReflectMode } from '@/lib/ai/types';

export async function saveCapsule(message: string, unlockAt: string) {
    if (isSafeMode()) {
        MOCK_HISTORY.unshift({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            mirror: "Time Capsule",
            pattern: "Message to Future Self",
            reframe: "Locked until " + unlockAt
        });
        return { success: true };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Auth required" };

    const { data: session, error } = await supabase.from('sessions').insert({
        user_id: user.id,
        initial_input: message,
        mode: 'capsule',
        unlock_at: unlockAt,
        mirror_text: "Time Capsule",
        pattern_text: "Sealed Message",
        reframe_text: "This message is sealed until " + new Date(unlockAt).toLocaleDateString()
    }).select('id').single();

    if (error) return { success: false, error: error.message };

    // --- TRIGGER NEURAL INDEXING (SAGE CORTEX) ---
    if (session) {
        await supabase.from('ghost_bridge').insert({
            command: `sage:embed ${session.id}|${message}`,
            status: 'pending'
        });
    }

    return { success: true };
}
