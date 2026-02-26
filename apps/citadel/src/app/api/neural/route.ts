import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@matrix-lib/supabase';
import { NeuralMesh } from '@matrix-lib/neural';
import { NeuralMemory } from '@matrix-lib/neural/memory';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const body = await request.json();
        const {
            action, // 'chat' | 'embed' | 'recall' | 'anchor'
            messages,
            text,
            embedding,
            userId,
            metadata,
            options
        } = body;

        // Security check: userId must match current user or be null for public/system
        const effectiveUserId = userId || user?.id;

        switch (action) {
            case 'chat':
                const response = await NeuralMesh.getCompletion({
                    messages,
                    forceLocal: options?.forceLocal,
                    preferLocal: options?.preferLocal,
                    ...options
                });

                // Emit Synaptic Pulse to Constellation Ring (Nexus)
                await supabase.from('ghost_bridge').insert({
                    command: 'sys:broadcast',
                    source: 'citadel_neural',
                    status: 'executed',
                    output: JSON.stringify({
                        type: 'resonance',
                        intensity: 1.5,
                        message: `MESH_PULSE: ${options?.model || 'NEURAL_LINK'}`
                    })
                });

                return NextResponse.json({ response });

            case 'embed':
                const vector = await NeuralMesh.getEmbedding(text);
                return NextResponse.json({ embedding: vector });

            case 'recall':
                if (!effectiveUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                const memories = await NeuralMemory.recall(supabase, embedding, effectiveUserId, options?.matchCount);
                return NextResponse.json({ memories });

            case 'anchor':
                if (!effectiveUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                await NeuralMemory.anchor(supabase, effectiveUserId, text, embedding, metadata);
                return NextResponse.json({ success: true });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[CITADEL_NEURAL] API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
