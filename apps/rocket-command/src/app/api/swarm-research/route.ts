import { NextRequest, NextResponse } from 'next/server';

/**
 * Swarm Research API v2.0
 * 
 * Evolution of the Deep Research pipeline using Swarm Consensus.
 * 
 * Flow:
 *   1. PLANNER decomposes the query.
 *   2. RESEARCHER gathers data for sub-questions.
 *   3. SWARM SYNTHESIS: 3 independent synthesizers create reports.
 *   4. CONCILIATOR: Merges the 3 reports into a high-reliability consensus.
 *   5. PRD EVOLUTION: Final Matrix-Standard PRD.
 */

interface ResearchStep {
    step: number;
    agent: string;
    action: string;
    result: string;
    timestamp: string;
}

/* ═══ SSE Helpers ═══ */
function sseEncode(data: object): Uint8Array {
    return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

/* ═══ LLM Call Helper (Delegated to Neural Mesh) ═══ */
async function llmMeshCall(messages: { role: string; content: string }[], options = {}): Promise<string> {
    const CITADEL_URL = process.env.CITADEL_URL || 'http://localhost:3005';
    try {
        const response = await fetch(`${CITADEL_URL}/api/neural`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'chat',
                messages,
                options
            })
        });

        if (!response.ok) throw new Error(`Neural Mesh Error: ${response.statusText}`);
        const data = await response.json();
        return data.response;
    } catch (err) {
        console.error('[SWARM_RESEARCH] Mesh call failed:', err);
        return '';
    }
}

/* ═══ Web Search Agent ═══ */
async function webSearch(query: string): Promise<string> {
    try {
        const encoded = encodeURIComponent(query);
        const res = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`, {
            signal: AbortSignal.timeout(8000)
        });
        const data = await res.json();
        const results: string[] = [];
        if (data.Abstract) results.push(`Overview: ${data.Abstract}`);
        if (data.Answer) results.push(`Answer: ${data.Answer}`);
        if (data.RelatedTopics) {
            for (const topic of data.RelatedTopics.slice(0, 5)) {
                if (topic.Text) results.push(`- ${topic.Text}`);
            }
        }
        return results.join('\n') || `No structured results found for: "${query}".`;
    } catch (err) {
        return `Search failed for "${query}".`;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { query, depth = 'standard' } = await request.json();

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Research query is required' }, { status: 400 });
        }

        const maxSubQuestions = depth === 'deep' ? 8 : depth === 'shallow' ? 3 : 5;
        const steps: ResearchStep[] = [];

        const readable = new ReadableStream({
            async start(controller) {
                const emit = (data: object) => controller.enqueue(sseEncode(data));

                try {
                    // ═══ PHASE 1: PLANNER AGENT ═══
                    emit({ phase: 'planning', message: 'Decomposing query into sub-questions...' });

                    const plannerPrompt = `Decompose this research query into ${maxSubQuestions} focused sub-questions. 
Output JSON: { "questions": ["q1", "q2", ...] }
Query: "${query}"`;

                    const plannerResult = await llmMeshCall([
                        { role: 'system', content: 'You are a precise research decomposition agent. Output valid JSON only.' },
                        { role: 'user', content: plannerPrompt }
                    ], { model: 'llama-3.3-70b-versatile' });

                    let subQuestions: string[] = [];
                    try {
                        subQuestions = JSON.parse(plannerResult).questions || [];
                    } catch {
                        subQuestions = plannerResult.split('\n').filter(l => l.length > 5).slice(0, maxSubQuestions);
                    }

                    steps.push({ step: 1, agent: 'Planner', action: 'Decomposed query', result: `Generated ${subQuestions.length} questions`, timestamp: new Date().toISOString() });
                    emit({ phase: 'planning_done', questions: subQuestions });

                    // ═══ PHASE 2: RESEARCHER AGENT ═══
                    const findings: { question: string; answer: string }[] = [];
                    for (let i = 0; i < subQuestions.length; i++) {
                        const q = subQuestions[i];
                        emit({ phase: 'researching', current: i + 1, total: subQuestions.length, question: q });

                        const searchResults = await webSearch(q);
                        const answer = await llmMeshCall([
                            { role: 'system', content: 'Synthesize search results into factual answers.' },
                            { role: 'user', content: `Question: "${q}"\n\nResults:\n${searchResults}` }
                        ]);

                        findings.push({ question: q, answer });
                        steps.push({ step: steps.length + 1, agent: 'Researcher', action: `Finished: ${q}`, result: 'Success', timestamp: new Date().toISOString() });
                    }

                    // ═══ PHASE 3: SWARM SYNTHESIS ═══
                    emit({ phase: 'swarming', message: 'Initiating Swarm Synthesis (3 independent agents)...' });

                    const rawFindings = findings.map((f, i) => `### Finding ${i + 1}: ${f.question}\n${f.answer}`).join('\n\n');

                    const synthesizerPrompt = `Synthesize these findings into an authoritative report for query: "${query}". Use markdown.\n\nFindings:\n${rawFindings}`;

                    // Spawn 3 independent synthesizers
                    const swarmTasks = [
                        llmMeshCall([{ role: 'user', content: synthesizerPrompt }], { temperature: 0.1 }),
                        llmMeshCall([{ role: 'user', content: synthesizerPrompt }], { temperature: 0.5 }),
                        llmMeshCall([{ role: 'user', content: synthesizerPrompt }], { temperature: 0.8 })
                    ];

                    const swarmReports = await Promise.all(swarmTasks);
                    emit({ phase: 'swarming_done', message: 'Worker reports received. Conciliating...' });

                    // ═══ PHASE 4: CONCILIATOR ═══
                    const conciliatorPrompt = `You are the Swarm Conciliator. Below are 3 independent synthesis reports for query: "${query}".
Merge them into a single, high-reliability authoritative report. Identify and resolve any contradictions.

REPORTS:
${swarmReports.map((r, i) => `--- REPORT ${i + 1} ---\n${r}`).join('\n\n')}

Write the FINAL comprehensive report in markdown.`;

                    const finalReport = await llmMeshCall([
                        { role: 'system', content: 'You are an elite cognitive orchestrator. Produce an authoritative consensus report.' },
                        { role: 'user', content: conciliatorPrompt }
                    ]);

                    // ═══ PHASE 5: PRD EVOLUTION ═══
                    emit({ phase: 'prd_generation', message: 'Evolving consensus into Matrix-Standard PRD...' });
                    const finalPRD = await llmMeshCall([
                        { role: 'system', content: 'Convert research into a Matrix-Standard PRD.' },
                        { role: 'user', content: `Data:\n${finalReport}` }
                    ]);

                    emit({
                        phase: 'complete',
                        report: finalReport,
                        prd: finalPRD,
                        steps
                    });

                } catch (err) {
                    emit({ phase: 'error', message: String(err) });
                }
                controller.close();
            }
        });

        return new Response(readable, {
            headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Swarm pipeline failed' }, { status: 500 });
    }
}
