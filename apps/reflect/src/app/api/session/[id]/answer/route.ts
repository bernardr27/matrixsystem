import { NextResponse } from 'next/server';
import { getDb } from '@/lib/sqlite';

export const runtime = 'nodejs';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await _req.json();
        const { answer } = body || {};
        if (!answer || typeof answer !== 'string') {
            return NextResponse.json({ error: 'answer is required' }, { status: 400 });
        }
        const db = getDb();
        const stmt = db.prepare('UPDATE sessions SET user_resolution = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?');
        const info = stmt.run(answer, id);
        if (info.changes === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Auto-detect patterns in the answer (fire and forget)
        detectPatternsAsync(id, answer).catch(err =>
            console.error('Pattern detection failed:', err)
        );

        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        const msg = err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'Internal error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

async function detectPatternsAsync(sessionId: string, text: string) {
    try {
        // Call pattern detection API
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL!}/api/patterns/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, sessionId })
        });

        if (!response.ok) {
            console.warn('Pattern detection returned non-OK status:', response.status);
        }
    } catch (error) {
        console.error('Pattern detection request failed:', error);
    }
}
