import { NextResponse } from 'next/server';
import { generateNeuralInsights } from '@/lib/ai/insights';

export async function POST(req: Request) {
    try {
        const { name, archetype, tier, calibrationSnippet } = await req.json();

        if (!archetype || !tier) {
            return NextResponse.json({ error: "Missing required setup data" }, { status: 400 });
        }

        const insights = await generateNeuralInsights(
            name || 'Unknown Seeker',
            archetype,
            tier,
            calibrationSnippet || ''
        );

        return NextResponse.json({ insights });
    } catch (error) {
        console.error("Insights API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
