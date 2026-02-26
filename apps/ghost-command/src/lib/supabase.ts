import { createBrowserSupabaseClientFromEnv } from '@matrix-lib/supabase/next';

export const supabase = createBrowserSupabaseClientFromEnv(process.env);

export const GHOST_BRIDGE_TABLE = 'ghost_bridge';
