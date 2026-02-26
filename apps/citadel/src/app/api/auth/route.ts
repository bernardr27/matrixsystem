import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@matrix-lib/supabase';
import { verifyCredentials, createSession, validateSession } from '@/lib/auth';

/* ═══════════════════════════════════════════════════════
   CITADEL AUTH API v2.2 (Matrix SSO + Local Fallback)
   GET  — Check local or Discord OAuth session validity
   POST — Login (action: 'login') or Logout (action: 'logout')
   ═══════════════════════════════════════════════════════ */

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    try {
        // PRE-FLIGHT: Check if Discord integration is enabled (for UI hints or error states)
        const { data: config } = await supabase
            .from('integration_configs')
            .select('enabled')
            .eq('integration_name', 'discord')
            .maybeSingle();

        if (config && !config.enabled) {
            console.warn('[Citadel Auth] Warning: Discord integration is disabled in integration_configs.');
        }

        // First, check for local session cookie
        const sessionToken = req.cookies.get('citadel_session')?.value;
        if (sessionToken) {
            const session = validateSession(sessionToken);
            if (session) {
                return NextResponse.json({
                    authenticated: true,
                    username: session.username || 'Matrix Operator',
                    avatar: null,
                    expiresAt: session.expiresAt
                });
            }
        }

        // If no local session, check Supabase session
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            username: user.user_metadata?.full_name || user.email || 'Matrix Operator',
            createdAt: user.created_at,
            expiresAt: null,
            avatar: user.user_metadata?.avatar_url || null
        });
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // ─── Test Login (FOR TESTING ONLY - REMOVE IN PRODUCTION) ───
        if (body.action === 'test-login') {
            const { username = 'test-user', avatar } = body;

            const token = createSession(username);

            const response = NextResponse.json({ success: true });
            response.cookies.set('citadel_session', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60,
                path: '/'
            });

            return response;
        }

        // ─── Local Login (Fallback when Supabase unavailable) ───
        if (body.action === 'login') {
            const { username, password } = body;

            // Verify credentials (default: operator/citadel)
            if (!verifyCredentials(username, password)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid credentials' },
                    { status: 401 }
                );
            }

            // Create session token
            const token = createSession(username);

            // Return success with token in httpOnly cookie
            const response = NextResponse.json({ success: true });
            response.cookies.set('citadel_session', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60, // 24 hours
                path: '/'
            });

            return response;
        }

        // ─── Logout ───
        if (body.action === 'logout') {
            const supabase = await createClient();
            await supabase.auth.signOut();

            // Also clear local session cookie
            const response = NextResponse.json({ success: true });
            response.cookies.delete('citadel_session');
            return response;
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('[Auth API Error]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
