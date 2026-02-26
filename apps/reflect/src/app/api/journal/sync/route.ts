import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const drafts = await request.json();

        if (!Array.isArray(drafts) || drafts.length === 0) {
            return NextResponse.json({ success: true, count: 0 });
        }

        const inserts = drafts.map((draft: any) => ({
            user_id: user.id,
            content: draft.content,
            mood: draft.mood,
            tags: draft.tags,
            created_at: draft.created_at || new Date().toISOString(),
            source: 'bg_sync'
        }));

        const { error } = await supabase.from('sessions').insert(inserts);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, count: drafts.length, syncedIds: drafts.map((d: any) => d.id) });

    } catch (error: any) {
        console.error('[BG_SYNC] Error syncing drafts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
