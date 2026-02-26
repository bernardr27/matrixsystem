import { NextResponse } from 'next/server';
import { getEngine } from '@/lib/ai/engine';
import { ReflectMode } from '@/lib/ai/types';

export const runtime = 'nodejs';

function enforceDemoGuardrails(resp: { mirror: string; pattern: string; insight: string; reframe: string }) {
    const combined = `${resp.mirror}\n\n${resp.pattern}\n\n${resp.insight}\n\n${resp.reframe}`.trim();
    const words = combined.split(/\s+/).filter(Boolean);
    if (words.length > 250) { // Increased slightly for the new field
        throw new Error('Response exceeds 250 words');
    }
    const questionMarks = (resp.reframe.match(/\?/g) || []).length;
    if (questionMarks !== 1) {
        throw new Error('Exactly one question required in Reframe');
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { text, mode = 'mindset', persona = 'sage', systemPrompt: customPrompt } = body || {};

        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'text is required' }, { status: 400 });
        }

        // Demo uses the default cloud engine
        const demoEngine = getEngine({ provider: 'openai' });

        const defaultSystemMsg = "You are the Reflect Guest Trial. Provide a high-quality but singular reflection. Because this is a guest trial, do not reference any historical knowledge or external nodes.";
        const systemMsg = customPrompt || defaultSystemMsg;

        const response = await demoEngine.generateReflection(
            text,
            mode as ReflectMode,
            [{ role: 'system', content: systemMsg }],
            undefined,
            persona as any,
            'Guest'
        );

        // Relax words guardrail if custom prompt is used (expansion mode needs more space)
        const combined = `${response.mirror}\n\n${response.pattern}\n\n${response.insight}\n\n${response.reframe}`.trim();
        const words = combined.split(/\s+/).filter(Boolean);
        const limit = customPrompt ? 400 : 250;

        if (words.length > limit) {
            throw new Error(`Response exceeds ${limit} words`);
        }

        return NextResponse.json({
            id: 'demo-' + Date.now(),
            response,
            limitations: [
                "Neural Memory is disabled for guest trials.",
                "Cortex Sync (Notion/Obsidian) is locked.",
                "Persistence is inactive."
            ]
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) || 'Internal error' }, { status: 500 });
    }
}
