import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch all episodic memories for the user
        const { data: memories, error: fetchError } = await supabase
            .from('episodic_memory')
            .select('id, content, metadata, created_at, embedding')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        const nodes = (memories || []).map((m: any) => ({
            id: m.id.toString(),
            label: m.content.substring(0, 50) + '...',
            timestamp: m.created_at,
            metadata: m.metadata,
            content: m.content
        }));

        const edges: any[] = [];
        const threshold = 0.85;

        // 2. Generate Semantic Edges (Cosine Similarity)
        // Note: For large datasets, this should be moved to a vector DB query or background job.
        // For a personal journal, N^2 comparison is acceptable for < 1000 nodes.
        if (memories && memories.length > 1) {
            for (let i = 0; i < memories.length; i++) {
                for (let j = i + 1; j < memories.length; j++) {
                    const sim = cosineSimilarity(memories[i].embedding, memories[j].embedding);
                    if (sim > threshold) {
                        edges.push({
                            id: `sim-${memories[i].id}-${memories[j].id}`,
                            source: memories[i].id.toString(),
                            target: memories[j].id.toString(),
                            weight: sim
                        });
                    }
                }
            }
        }

        return NextResponse.json({ nodes, edges });
    } catch (err: any) {
        console.error("[MIND_GRAPH_API] Sync error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
