import { NextResponse, type NextRequest } from 'next/server'
import { initSupabaseMiddleware, getLoginRedirectUrl } from '@matrix-lib/supabase';

export async function middleware(request: NextRequest) {
    const { supabase, getResponse } = initSupabaseMiddleware(request);

    const { data: { user } } = await supabase.auth.getUser();
    const allowGuest = process.env.NEXUS_ALLOW_GUEST === '1' || process.env.NODE_ENV !== 'production';

    // If unauthorized and navigating to a core route, repel to Citadel master gateway.
    if (!user && !allowGuest && !request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/_next')) {
        return NextResponse.redirect(new URL(getLoginRedirectUrl(request), request.url));
    }

    return getResponse();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
