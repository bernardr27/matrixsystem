import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@matrix-lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        // Fetch tasks from the market
        const { data: tasks, error } = await supabase
            .from('hive_market_tasks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        return NextResponse.json({
            status: 'success',
            tasks: tasks || []
        });
    } catch (err) {
        console.error('[MARKET_API] Failed to fetch market status:', err);
        return NextResponse.json({ status: 'error', tasks: [] }, { status: 500 });
    }
}
