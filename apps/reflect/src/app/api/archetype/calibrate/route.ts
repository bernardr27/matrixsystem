import { NextRequest, NextResponse } from 'next/server';
import { getRankedArchetypes } from '@/lib/ai/archetypes';

export async function POST(request: NextRequest) {
    try {
        const { input } = await request.json();

        if (!input) {
            return NextResponse.json({ error: 'Input is required' }, { status: 400 });
        }

        // Use the new ranking engine to get the top 3 matches
        const archetypes = getRankedArchetypes(input);

        return NextResponse.json({ archetypes });

    } catch (error) {
        console.error('Calibration API error:', error);
        return NextResponse.json({ error: 'Failed to calibrate signal' }, { status: 500 });
    }
}
