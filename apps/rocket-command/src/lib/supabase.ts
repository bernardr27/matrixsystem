import { createBrowserSupabaseClientFromEnv } from '@matrix-lib/supabase/next';

export const supabase = createBrowserSupabaseClientFromEnv(process.env);
