import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const text = searchParams.get('text');
        const patternType = searchParams.get('patternType');
        const mode = searchParams.get('mode');

        const supabase = await createClient();

        if (text) {
            const { reflectEngine } = await import('@/lib/ai/engine');
            const embedding = await reflectEngine.generateEmbedding(text);

            const { data, error } = await supabase.rpc('match_sessions', {
                query_embedding: embedding,
                match_threshold: 0.5,
                match_count: 5,
            });

            if (error) throw error;
            return NextResponse.json({ resonating: data || [] });
        }

        let query = supabase
            .from('collective_wisdom')
            .select('*')
            .order('resonance_count', { ascending: false })
            .limit(5);

        if (patternType) {
            query = query.eq('pattern_type', patternType);
        } else if (mode) {
            query = query.eq('mode', mode);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ resonating: data || [] });

    } catch (error: unknown) {
        console.error('Discovery error:', error);
        return NextResponse.json({ error: 'Failed to find resonating thoughts' }, { status: 500 });
    }
}
