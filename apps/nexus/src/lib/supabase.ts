import { createBrowserSupabaseClientFromEnv } from '@matrix-lib/supabase/next';
import { createClient } from '@supabase/supabase-js';

function createFallbackClient() {
    return createClient('http://127.0.0.1:54321', 'public-anon-key', {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        global: {
            fetch: async () => new Response(JSON.stringify({ error: 'SUPABASE_NOT_CONFIGURED' }), { status: 503 }),
        },
    });
}

export const supabase = (() => {
    try {
        return createBrowserSupabaseClientFromEnv(process.env);
    } catch (error) {
        if (typeof window !== 'undefined') {
            console.warn('[nexus] Supabase env missing; running in offline-safe mode.');
        }
        return createFallbackClient();
    }
})();
