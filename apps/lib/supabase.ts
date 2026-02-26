import { createBrowserSupabaseClientFromEnv } from '@matrix-lib/supabase/next'

export const createClient = () => {
    return createBrowserSupabaseClientFromEnv(process.env);
};

// Default export is the singleton client for browser use
const supabase = createClient();
export default supabase;
