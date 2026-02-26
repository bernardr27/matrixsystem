/**
 * CITADEL SUPABASE PROXY
 * ══════════════════════
 * Passes Supabase REST and Realtime calls through Citadel (localhost:3005)
 * so browser apps never need a direct outbound connection to Cloudflare.
 * 
 * Usage from any Next.js app:
 *   const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
 *   // Replace: 'https://phmn....supabase.co' with 'http://localhost:3005/api/supabase-proxy'
 */

import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

export async function GET(req: NextRequest) {
    return proxy(req, 'GET');
}
export async function POST(req: NextRequest) {
    return proxy(req, 'POST');
}
export async function PATCH(req: NextRequest) {
    return proxy(req, 'PATCH');
}
export async function PUT(req: NextRequest) {
    return proxy(req, 'PUT');
}
export async function DELETE(req: NextRequest) {
    return proxy(req, 'DELETE');
}

async function proxy(req: NextRequest, method: string) {
    // Strip /api/supabase-proxy and forward the rest to Supabase
    const subPath = req.nextUrl.searchParams.get('path') || '/rest/v1/';
    const search = req.nextUrl.search.replace(/[?&]path=[^&]+/, '').replace(/^&/, '?');
    const target = `${SUPABASE_URL}${subPath}${search}`;

    const headers: Record<string, string> = {
        'apikey': SUPABASE_KEY,
        'Authorization': req.headers.get('authorization') || `Bearer ${SUPABASE_KEY}`,
        'Content-Type': req.headers.get('content-type') || 'application/json',
    };

    let body: BodyInit | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
        try { body = await req.text(); } catch { }
    }

    try {
        const res = await fetch(target, { method, headers, body });
        const data = await res.text();
        return new NextResponse(data, {
            status: res.status,
            headers: {
                'Content-Type': res.headers.get('content-type') || 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[SUPABASE_PROXY] fetch failed:', msg);
        return NextResponse.json({ error: 'Supabase proxy failed', detail: msg }, { status: 502 });
    }
}
