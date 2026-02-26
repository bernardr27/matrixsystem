import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/sqlite';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const db = getDb();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let nodes: any[] = [];
        let edges: any[] = [];

        if (user) {
            // Fetch sessions with more metadata
            const { data: sessionData } = await supabase.from('sessions')
                .select('id, mode, initial_input, mirror_text, created_at, emotion, mood_score')
                .eq('user_id', user.id)
                .is('is_trashed', false)
                .order('created_at', { ascending: true });

            // Fetch embeddings for semantic spatial mapping
            const { data: embeddingData } = await supabase.from('session_embeddings')
                .select('session_id, embedding')
                .eq('user_id', user.id);

            const embeddingMap = new Map();
            (embeddingData || []).forEach((e: any) => {
                // If embedding is a string (Postgres vector format), parse it; though Supabase client usually handles this.
                embeddingMap.set(e.session_id, e.embedding);
            });

            nodes = (sessionData || []).map((s: any) => ({
                id: s.id,
                label: (s.initial_input || 'Untitled Session').substring(0, 30) + '...',
                mode: s.mode,
                date: s.created_at,
                emotion: s.emotion,
                mood_score: s.mood_score,
                embedding: embeddingMap.get(s.id),
                type: 'session'
            }));

            const { data: synapseData } = await supabase.from('synapses')
                .select('*');

            edges = (synapseData || []).map((syn: any) => ({
                id: syn.id,
                source: syn.source_id,
                target: syn.target_id,
                type: syn.type,
                strength: syn.strength,
                label: syn.label || syn.type
            }));
        } else {
            // Fetch from local SQLite
            const sessions = db.prepare(`
                SELECT id, mode, initial_input, mirror_text, started_at 
                FROM sessions 
                ORDER BY started_at ASC
            `).all();

            nodes = sessions.map((s: any) => ({
                id: s.id.toString(),
                label: s.initial_input.substring(0, 30) + '...',
                mode: s.mode,
                date: s.started_at,
                type: 'session'
            }));

            const synapses = db.prepare(`SELECT * FROM synapses`).all();

            edges = synapses.map((syn: any) => ({
                id: `syn-${syn.id}`,
                source: syn.source_id.toString(),
                target: syn.target_id.toString(),
                type: syn.type,
                label: syn.description || syn.type
            }));
        }

        // Fallback: If no semantic synapses exist, create a temporal sequence
        if (edges.length === 0 && nodes.length > 1) {

            for (let i = 0; i < nodes.length - 1; i++) {
                edges.push({
                    id: `seq-${i}`,
                    source: nodes[i].id,
                    target: nodes[i + 1].id,
                    type: 'sequence',
                    label: 'CHRONOLOGICAL_FLOW'
                });
            }
        }

        return NextResponse.json({ nodes, edges });
    } catch (err: unknown) {
        return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) || 'Internal error' }, { status: 500 });
    }
}
