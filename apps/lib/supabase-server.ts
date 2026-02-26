import { createServerSupabaseClientFromCookies } from '@matrix-lib/supabase/next'
import { cookies } from 'next/headers'

export const createServerSupabaseClient = async () => {
    const cookieStore = await cookies()
    return createServerSupabaseClientFromCookies(cookieStore, process.env);
}
