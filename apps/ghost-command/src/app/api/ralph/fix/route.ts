import { NextResponse } from 'next/server';
import { createAnonSupabaseClientFromEnv } from '@matrix-lib/supabase/admin';

export const dynamic = 'force-dynamic';

function getSupabase() {
    return createAnonSupabaseClientFromEnv(process.env);
}

export async function POST(req: Request) {
    try {
        const { action } = await req.json();
        const supabase = getSupabase();

        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        let command = 'ralph:scan';
        if (action === 'auto-heal') command = 'ralph:visual_scan';
        if (action === 'simulate') command = 'ralph:simulate_scan';
        if (action === 'audit') command = 'ralph:audit';
        if (action === 'purge') command = 'ralph:purge_shadows';

        const { data, error } = await supabase.from('ghost_bridge').insert({
            command: command,
            source: 'triage_panel',
            status: 'pending'
        }).select().single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
