import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

/* ═══════════════════════════════════════════════════════
   CITADEL TUNNEL API v1.0 — Public access URL
   GET — Returns current tunnel URL (written by guardian)
   ═══════════════════════════════════════════════════════ */

const TUNNEL_FILE = path.join(process.cwd(), '.tunnel-url');

function checkAuth(req: NextRequest): boolean {
    const token = req.cookies.get('citadel-session')?.value;
    return !!token && !!validateSession(token);
}

export async function GET(req: NextRequest) {
    if (!checkAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (fs.existsSync(TUNNEL_FILE)) {
            const data = JSON.parse(fs.readFileSync(TUNNEL_FILE, 'utf-8'));
            return NextResponse.json({
                active: true,
                url: data.url,
                startedAt: data.startedAt,
                port: data.port,
            });
        }
    } catch {}

    return NextResponse.json({
        active: false,
        url: null,
        startedAt: null,
        port: null,
    });
}
