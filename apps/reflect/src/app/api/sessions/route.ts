import { NextResponse } from 'next/server';
import { getDb } from '@/lib/sqlite';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const db = getDb();
        const rows = db.prepare('SELECT id, mode, started_at, completed_at, initial_input, mirror_text, pattern_text FROM sessions ORDER BY started_at DESC LIMIT 100').all();
        return NextResponse.json({ sessions: rows });
    } catch (err: unknown) {
        return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) || 'Internal error' }, { status: 500 });
    }
}
