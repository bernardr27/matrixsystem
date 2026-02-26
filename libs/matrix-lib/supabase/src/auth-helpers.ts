import { NextRequest } from 'next/server'

/**
 * Resolves the central Citadel gateway URL dynamically.
 * If accessed via localhost, returns http://localhost:3005.
 * If accessed via Tailscale Funnel or other proxy, returns the current host.
 */
export function getAuthGatewayUrl(request: NextRequest): string {
    const url = request.nextUrl.clone()
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''

    // If on localhost but not on Citadel's port (3005), redirect to Citadel at 3005
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
        // If we're already on localhost:3005, just return /
        if (host.includes(':3005')) {
            return '/'
        }
        return 'http://localhost:3005'
    }

    // If on a public domain (Tailscale Funnel), the root is assumed to be Citadel.
    // Note: This logic assumes Citadel is the entry point for the domain.
    return `${url.protocol}//${host}`
}

/**
 * Generates a redirect URL to the Citadel login page with a return path.
 * Includes the full origin to ensure cross-port redirection works on localhost.
 */
export function getLoginRedirectUrl(request: NextRequest): string {
    const gateway = getAuthGatewayUrl(request)
    const origin = request.nextUrl.origin
    const next = origin + request.nextUrl.pathname + request.nextUrl.search

    // If gateway is just '/', we are already on Citadel
    if (gateway === '/') {
        return `/?next=${encodeURIComponent(next)}`
    }

    // Ensure gateway ends without trailing slash for concatenation
    const base = gateway.endsWith('/') ? gateway.slice(0, -1) : gateway
    return `${base}/?next=${encodeURIComponent(next)}`
}
