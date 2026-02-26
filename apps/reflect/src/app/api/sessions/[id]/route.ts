import { NextResponse } from 'next/server';
import { getDb } from '@/lib/sqlite';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const db = getDb();
        const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
        if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ session: row });
    } catch (err: unknown) {
        return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) || 'Internal error' }, { status: 500 });
    }
}
