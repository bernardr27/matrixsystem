import { createBrowserSupabaseClientFromEnv } from '@matrix-lib/supabase/next';

export function createClient() {
    return createBrowserSupabaseClientFromEnv(process.env);
}
