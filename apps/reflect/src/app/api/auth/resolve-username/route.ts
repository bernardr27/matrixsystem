import { createAdminSupabaseClientFromEnv } from '@matrix-lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { username } = await req.json();

        if (!username) {
            return NextResponse.json({ error: 'Username required' }, { status: 400 });
        }

        // Initialize Supabase - Use Admin if available, otherwise Anon
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAdmin = createAdminSupabaseClientFromEnv(process.env);
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
        }

        if (!serviceKey) {
            console.warn('[AUTH_API] SUPABASE_SERVICE_ROLE_KEY missing. Falling back to ANON key. User resolution may fail if RLS is strict.');
        }

        // Query profiles table
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .or(`username.ilike.${username.trim()},email.ilike.${username.trim()}`)
            .limit(1)
            .maybeSingle();

        if (error || !profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ email: profile.email });

    } catch (err: unknown) {
        return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
    }
}
