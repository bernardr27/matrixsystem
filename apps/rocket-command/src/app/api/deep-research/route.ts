import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

/**
 * Deep Research API v1.0
 * 
 * Asynchronous multi-agent pipeline that performs iterative internet research,
 * synthesis, and knowledge consolidation. Uses a "Planner → Researcher → Synthesizer"
 * agentic loop to deeply explore a topic across multiple search passes.
 * 
 * Flow: 
 *   1. PLANNER decomposes the query into sub-questions
 *   2. RESEARCHER gathers information for each sub-question
 *   3. SYNTHESIZER merges all findings into a comprehensive report
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
        console.error('[DEEP_RESEARCH] Mesh call failed:', err);
        return '';
    }
}

/* ═══ Web Search Agent ═══ */
async function webSearch(query: string): Promise<string> {
    // Use DuckDuckGo Instant Answer API (free, no key required)
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
                if (topic.Topics) {
                    for (const sub of topic.Topics.slice(0, 3)) {
                        if (sub.Text) results.push(`  - ${sub.Text}`);
                    }
                }
            }
        }

        if (results.length === 0) {
            return `No structured results found for: "${query}". The AI will use its training data.`;
        }

        return results.join('\n');
    } catch (err) {
        return `Search failed for "${query}". Using AI knowledge base as fallback.`;
    }
}

/* ═══ POST — Deep Research Handler ═══ */
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

                    const plannerPrompt = `You are a research planner. Given this research query, decompose it into ${maxSubQuestions} focused sub-questions that, when answered, will provide comprehensive coverage of the topic. 
                    
Output a JSON object with a single key "questions" containing an array of strings.

Research Query: "${query}"`;

                    const plannerResult = await llmMeshCall([
                        { role: 'system', content: 'You are a precise research decomposition agent. Output valid JSON only.' },
                        { role: 'user', content: plannerPrompt }
                    ], { model: 'llama-3.3-70b-versatile' });

                    let subQuestions: string[] = [];
                    try {
                        const parsed = JSON.parse(plannerResult);
                        subQuestions = parsed.questions || [];
                    } catch {
                        // Fallback: extract questions from raw text
                        subQuestions = plannerResult.split('\n').filter(l => l.trim().length > 10).slice(0, maxSubQuestions);
                    }

                    steps.push({
                        step: 1,
                        agent: 'Planner',
                        action: 'Decomposed query',
                        result: `Generated ${subQuestions.length} sub-questions`,
                        timestamp: new Date().toISOString()
                    });

                    emit({ phase: 'planning_done', questions: subQuestions, count: subQuestions.length });

                    // ═══ PHASE 2: RESEARCHER AGENT ═══
                    const findings: { question: string; answer: string; sources: string }[] = [];

                    for (let i = 0; i < subQuestions.length; i++) {
                        const q = subQuestions[i];
                        emit({ phase: 'researching', current: i + 1, total: subQuestions.length, question: q });

                        // Step 2a: Search the web
                        const searchResults = await webSearch(q);

                        // Step 2b: LLM synthesizes search results into a focused answer
                        const researcherPrompt = `Based on the following search results, provide a comprehensive, factual answer to this question. Include specific details, numbers, and citations where possible.

Question: "${q}"

Search Results:
${searchResults}

Provide a thorough 2-3 paragraph answer. Be specific and factual.`;

                        const answer = await llmMeshCall([
                            { role: 'system', content: 'You are a meticulous research analyst. Synthesize search results into clear, factual answers. Cite specific data points when available.' },
                            { role: 'user', content: researcherPrompt }
                        ]);

                        findings.push({ question: q, answer, sources: searchResults.substring(0, 200) });

                        steps.push({
                            step: 2 + i,
                            agent: 'Researcher',
                            action: `Researched: ${q.substring(0, 60)}...`,
                            result: `${answer.substring(0, 100)}...`,
                            timestamp: new Date().toISOString()
                        });

                        emit({ phase: 'research_result', index: i + 1, question: q, preview: answer.substring(0, 200) });
                    }

                    // ═══ PHASE 3: SYNTHESIZER AGENT ═══
                    emit({ phase: 'synthesizing', message: 'Consolidating all findings into a comprehensive report...' });

                    const synthesizerPrompt = `You are a senior research analyst compiling a comprehensive report. Synthesize the following research findings into a well-structured, authoritative document.

Original Query: "${query}"

Research Findings:
${findings.map((f, i) => `
### Finding ${i + 1}: ${f.question}
${f.answer}
`).join('\n')}

Write a comprehensive research report with:
1. **Executive Summary** (2-3 sentences)
2. **Key Findings** (organized by theme, not by question)
3. **Analysis & Connections** (identify patterns and relationships between findings)
4. **Conclusions & Recommendations**

Use markdown formatting. Be thorough but concise. Cite specific data points where available.`;

                    const finalReport = await llmMeshCall([
                        { role: 'system', content: 'You are a world-class research synthesizer. Create clear, authoritative reports from raw research data. Use markdown formatting.' },
                        { role: 'user', content: synthesizerPrompt }
                    ]);

                    // ═══ PHASE 4: PRD EVOLUTION ═══
                    emit({ phase: 'prd_generation', message: 'Evolving research findings into a Matrix-Standard PRD...' });

                    const prdPrompt = `Convert the following research findings into a Matrix-Standard PRD (Product Requirements Document). 
                    
Format:
# PRD: [Project Title]
## Executive Summary
## Goals & Objectives
## S0: Critical Core Features
## S1: Planned Expansions
## Tech Stack & Architecture
## User Stories Table (Story | Priority | Acceptance Criteria)

Use internal Matrix project standards. 

Research Data:
${finalReport}`;

                    const finalPRD = await llmMeshCall([
                        { role: 'system', content: 'You are a technical architect. Convert research into actionable PRDs.' },
                        { role: 'user', content: prdPrompt }
                    ]);

                    steps.push({
                        step: steps.length + 1,
                        agent: 'Synthesizer',
                        action: 'Compiled final report',
                        result: `${finalReport.length} characters`,
                        timestamp: new Date().toISOString()
                    });

                    emit({
                        phase: 'complete',
                        report: finalReport,
                        prd: finalPRD,
                        metadata: {
                            query,
                            depth,
                            subQuestions: subQuestions.length,
                            totalSteps: steps.length,
                            timestamp: new Date().toISOString()
                        },
                        steps
                    });

                } catch (err) {
                    emit({ phase: 'error', message: err instanceof Error ? err.message : 'Research pipeline failed' });
                }

                controller.close();
            }
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error) {
        console.error('[Deep Research Error]', error);
        return NextResponse.json(
            { error: 'Research pipeline failed', detail: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
