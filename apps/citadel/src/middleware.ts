import { NextResponse, type NextRequest } from 'next/server'
import { initSupabaseMiddleware, getLoginRedirectUrl } from '@matrix-lib/supabase';

export async function middleware(request: NextRequest) {
    // First, check for local session cookie (for fallback auth)
    const hasLocalSession = request.cookies.has('citadel_session');
    if (hasLocalSession) {
        // Local session exists, allow access
        return NextResponse.next();
    }

    const { supabase, getResponse } = initSupabaseMiddleware(request);

    const { data: { user } } = await supabase.auth.getUser();

    // If unauthorized and navigating to dashboard, redirect to login
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL(getLoginRedirectUrl(request), request.url));
    }

    return getResponse();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
