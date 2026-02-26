/**
 * Phase 23: Sage Memory Recall API
 * 
 * Allows Matrix Hub to search through Sage's conversation history
 * stored in Supabase sage_memory table.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAnonSupabaseClientFromEnv } from '@matrix-lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Safe initialization
const supabase = createAnonSupabaseClientFromEnv(process.env);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!supabase) {
            return NextResponse.json({ memories: [], total: 0, message: 'Sage memory offline (config).' });
        }

        // Get all memory
        const { data, error } = await supabase
            .from('sage_memory')
            .select('history, updated_at')
            .eq('id', 'sage_default')
            .single();

        if (error || !data) {
            return NextResponse.json({ memories: [], total: 0, message: 'No memories found.' });
        }

        let history = data.history || [];

        // If search query provided, filter
        if (query) {
            const q = query.toLowerCase();
            history = history.filter((msg: any) =>
                msg.content?.toLowerCase().includes(q) ||
                msg.role?.toLowerCase().includes(q)
            );
        }

        // Return most recent first
        const memories = history.slice(-limit).reverse();

        return NextResponse.json({
            memories,
            total: history.length,
            lastUpdated: data.updated_at,
            searchQuery: query || null
        });

    } catch (err) {
        console.error('[SAGE_RECALL] Error:', err);
        return NextResponse.json(
            { error: 'Memory recall failed', memories: [] },
            { status: 500 }
        );
    }
}
