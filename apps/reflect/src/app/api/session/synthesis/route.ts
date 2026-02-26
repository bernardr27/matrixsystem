import { NextResponse } from 'next/server';
import { getEngine } from '@/lib/ai/engine';
import { SentinelLogger } from '@/lib/sentinel/logger';

export async function POST(req: Request) {
    try {
        const { originalInput, aiInsights, userResolution, mode } = await req.json();

        if (!originalInput || !userResolution) {
            return NextResponse.json({ error: 'Missing session data' }, { status: 400 });
        }

        const engine = getEngine();

        const systemPrompt = `You are the Reflect Synthesis Engine. 
Take the user's initial thought, the AI reframe provided, and the user's final resolution.
Weave them into a singular, poetic, and high-fidelity conclusion (max 3 sentences).
The goal is to provide a sense of transcendence and closure.
Mode context: ${mode}`;

        const prompt = `INITIAL_INTENT: "${originalInput}"
AI_ANALYSIS: "${aiInsights}"
USER_INTEGRATION: "${userResolution}"

Provide the final synthesis.`;

        const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ];

        if (req.headers.get('accept') === 'text/event-stream') {
            const encoder = new TextEncoder();
            const stream = engine.streamCompletion(messages);

            const readable = new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of stream) {
                            controller.enqueue(encoder.encode(chunk));
                        }
                        controller.close();
                    } catch (e) {
                        controller.error(e);
                    }
                }
            });

            return new Response(readable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        const response = await engine.getCompletion(messages);

        return NextResponse.json({ synthesis: response.content });
    } catch (err: unknown) {
        SentinelLogger.log(err instanceof Error ? err : String(err), { zone: 'session_synthesis' });
        return NextResponse.json({ error: 'Synthesis failed' }, { status: 500 });
    }
}
