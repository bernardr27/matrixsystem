'use server';

import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';
import { MOCK_HISTORY } from '@/lib/debug/mocks';

export async function searchSessions(query: string) {
    if (!query.trim()) return [];

    if (isSafeMode()) {
        const q = query.toLowerCase();
        return MOCK_HISTORY.filter(h =>
            h.mirror.toLowerCase().includes(q) ||
            h.pattern.toLowerCase().includes(q) ||
            h.reframe.toLowerCase().includes(q)
        ).map(h => ({
            id: h.id,
            initial_input: "Mock reflection matching " + query,
            created_at: h.date,
            mode: 'mindset'
        }));
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

          // Sanitize query to prevent PostgREST filter injection
          const sanitized = query.replace(/[%_,()]/g, '');
          if (!sanitized.trim()) return [];

          const { data } = await supabase
              .from('sessions')
              .select('id, initial_input, mirror_text, pattern_text, created_at, mode')
              .eq('user_id', user.id)
              .or(`initial_input.ilike.%${sanitized}%,mirror_text.ilike.%${sanitized}%,pattern_text.ilike.%${sanitized}%`)
              .limit(20);

          return data || [];
    } catch (error) {
        console.error("Search error:", error);
        return [];
    }
}
