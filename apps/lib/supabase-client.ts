import { createBrowserSupabaseClientFromEnv } from '@matrix-lib/supabase/next'

export const createClient = () => {
    return createBrowserSupabaseClientFromEnv(process.env);
};

export default createClient();
