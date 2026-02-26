import { createServerSupabaseClientFromCookies } from '@matrix-lib/supabase/next';
import { cookies } from 'next/headers';

export async function createClient() {
    const cookieStore = await cookies();
    return createServerSupabaseClientFromCookies(cookieStore, process.env);
}
