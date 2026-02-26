import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * AntiGravity Superpower API v1.0
 * ══════════════════════════════
 * Synthesizes NotebookLM grounded research into Matrix-Standard PRDs.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { research_data, target_app, metadata } = body;

        if (!research_data) {
            return NextResponse.json({ error: 'Missing research data' }, { status: 400 });
        }

        console.log(`[ANTIGRAVITY_BRIDGE] Synthesizing research for: ${target_app || 'Generic Context'}`);

        // 1. Structure the PRD based on Matrix standards
        const prd = {
            id: `PRD-${Date.now()}`,
            title: `NotebookLM Synthesis: ${target_app || 'New Matrix Module'}`,
            status: 'draft',
            created_at: new Date().toISOString(),
            content: {
                summary: "Source-grounded synthesis generated via AntiGravity Intelligence bridge.",
                raw_research: research_data,
                requirements: [
                    "Must integrate with Neural Mesh",
                    "Adheres to Sovereign OS design tokens",
                    "Local-first architecture"
                ],
                source_metadata: metadata || {}
            }
        };

        // 2. Save to Supabase (Collective Insights / Patterns)
        const supabase = await createClient();
        const { error: dbError } = await supabase
            .from('collective_insights')
            .insert([{
                insight_type: 'research_spec',
                content: prd,
                metadata: { source: 'notebooklm', mcp_relay: true }
            }]);

        if (dbError) throw dbError;

        return NextResponse.json({
            status: 'success',
            message: 'Research synthesized and registered to Collective Insights',
            prd_id: prd.id
        });

    } catch (err: any) {
        console.error('[ANTIGRAVITY_BRIDGE] Synthesis failed:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
