import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reflectEngine } from '@/lib/ai/engine';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId, input, reframe, mode, patternType } = await request.json();

        if (!input || !reframe) {
            return NextResponse.json({ error: 'Missing content' }, { status: 400 });
        }

        // AI Sanitization Pass
        const systemPrompt = `
You are the "Neural Privacy Gateway".
Your Task: Scrub all personally identifiable information (PII) from the text.
PII includes: Names, Locations, Company Names, Specific Entities, or identifying details.
Replace them with generic descriptors (e.g., "my partner", "an office", "a friend").
Maintain the emotional resonance and core insight of the message.

Return ONLY a JSON object: {"sanitizedInput": "...", "sanitizedReframe": "..."}
`;

        const completion = await reflectEngine.getCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Input: ${input}\nReframe: ${reframe}` }
        ]);

        const raw = completion.content.trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const sanitized = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

        // Publish to collective
        const { error } = await supabase.from('collective_wisdom').insert({
            mode,
            sanitized_input: sanitized.sanitizedInput,
            sanitized_reframe: sanitized.sanitizedReframe,
            pattern_type: patternType,
        });

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error('Sharing error:', error);
        return NextResponse.json({ error: 'Failed to share wisdom' }, { status: 500 });
    }
}
