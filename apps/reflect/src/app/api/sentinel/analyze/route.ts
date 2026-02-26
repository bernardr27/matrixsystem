import { NextResponse } from 'next/server';

/**
 * Server-side proxy to Ollama for Sentinel AI analysis.
 * This runs on the server where localhost:11434 (Ollama) is reachable,
 * so mobile/remote clients can use it without hitting CORS or localhost issues.
 */
export async function POST(req: Request) {
    try {
        const { errorMessage } = await req.json();

        if (!errorMessage || typeof errorMessage !== 'string') {
            return NextResponse.json({ error: 'Missing errorMessage' }, { status: 400 });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2:latest',
                messages: [{
                    role: 'user',
                    content: `You are the Sentinel (System Guardian). Analyze this error: "${errorMessage}".
                    Return JSON with:
                    - insight (1 sentence explanation)
                    - action (one of: repair_auth, repair_network, clear_cache, reload, none)
                    - confidence (0.0 to 1.0)
                    `
                }],
                stream: false,
                options: { num_ctx: 4096 }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return NextResponse.json({ error: 'Ollama offline' }, { status: 502 });
        }

        const data = await response.json();
        const content = data.message.content;

        // Extract JSON from potential markdown wrappers
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (parsed && parsed.insight && parsed.action) {
            return NextResponse.json({
                insight: parsed.insight,
                action: parsed.action,
                confidence: parsed.confidence || 0.9
            });
        }

        return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 });
    } catch (e: unknown) {
        const message = e instanceof Error ? (e instanceof Error ? e.message : String(e)) : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
