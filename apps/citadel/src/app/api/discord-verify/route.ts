import { NextRequest, NextResponse } from 'next/server';
import { verifyLoginCode } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { discordId, code } = await req.json();
        const username = verifyLoginCode(code, discordId);
        if (!username) {
            return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
        }
        return NextResponse.json({ success: true, username });
    } catch (err) {
        return NextResponse.json({ error: 'Malformed request' }, { status: 400 });
    }
}
