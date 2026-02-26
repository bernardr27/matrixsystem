import { createServiceSupabaseClientFromEnv } from '@matrix-lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { userId, securityAnswer, newPassword } = await req.json();

        if (!userId || !securityAnswer || !newPassword) {
            return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
        }

        // Initialize Supabase with Service Role for administrative override
        const supabaseAdmin = createServiceSupabaseClientFromEnv(process.env);
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 });
        }

        // 1. Verify Security Answer against Profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('security_answer_hash')
            .eq('id', userId)
            .maybeSingle();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Identity verification failed' }, { status: 401 });
        }

        if (profile.security_answer_hash !== securityAnswer.trim()) {
            return NextResponse.json({ error: 'Security response mismatch' }, { status: 401 });
        }

        // 2. Administrative Password Override
        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (resetError) {
            return NextResponse.json({ error: resetError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Encryption keys updated.' });

    } catch (err: unknown) {
        return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
    }
}
