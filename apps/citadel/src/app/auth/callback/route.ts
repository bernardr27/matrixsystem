import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@matrix-lib/supabase'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (errorParam) {
        console.error(`[Auth Callback] OAuth Error: ${errorParam} - ${errorDescription}`);
        return NextResponse.redirect(`${origin}/?error=${errorParam}&description=${encodeURIComponent(errorDescription || '')}`)
    }

    if (code) {
        const supabase = await createServerSupabaseClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalhost = process.env.NODE_ENV === 'development'
            if (isLocalhost) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/?error=auth-callback-failed`)
}
