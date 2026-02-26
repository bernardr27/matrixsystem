import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';

export async function POST(req: NextRequest) {
    // 1. Safe Mode Check
    if (isSafeMode()) {
        return NextResponse.json({ success: true, mode: 'safemode', id: 'mock-session-id' });
    }

    // 2. Validate Headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer sk_reflect_')) {
        return NextResponse.json({ error: 'Unauthorized: Missing or invalid API Key' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const supabase = await createClient();

    // 3. Lookup Key (Simplified: In prod we'd hash the token to compare with key_hash)
    // For MVP/Demo: we assume the key is the hash or stored directly.
    // Ideally: Verify key existence.
    // Here we query matches. In a real system, store HASH(token) -> ID.
    const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .select('user_id')
        .eq('key_hash', token) // Assumes token stored raw for MVP or client handles hashing. 
        // Security Note: Don't store raw keys in prod.
        .single();

    if (keyError || !keyData) {
        return NextResponse.json({ error: 'Unauthorized: Invalid Key' }, { status: 401 });
    }

    // 4. Parse Body
    const body = await req.json();
    const { input, mode = 'mindset' } = body;

    if (!input) {
        return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }

    // 5. Create Session
    const { data: session, error } = await supabase.from('sessions').insert({
        user_id: keyData.user_id,
        initial_input: input,
        mode: mode,
        // Optional AI Processing trigger here
    }).select().single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: session.id });
}
