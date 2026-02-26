import OpenAI from 'openai';
import { matrixToolsSchema, executeMatrixTool } from '../tools';
import { AIProvider, ReflectMode, ReflectResponse, SagePersona } from '../types';

export class OpenAICompatibleProvider implements AIProvider {
    private client: OpenAI;
    private model: string;
    private visionModel: string;

    constructor(baseURL: string, apiKey: string, model: string) {
        // HYBRID MODE: Try Groq Cloud first, fallback to local Ollama
        const groqKey = process.env.GROQ_API_KEY;

        if (groqKey) {
            // Cloud Mode: Groq API (OpenAI-compatible)
            this.client = new OpenAI({
                baseURL: 'https://api.groq.com/openai/v1',
                apiKey: groqKey,
                dangerouslyAllowBrowser: true
            });
            this.model = 'llama-3.3-70b-versatile';
            this.visionModel = 'llama-3.2-11b-vision-preview';
            // console.log('[REFLECT_ENGINE] Initialized with Groq Cloud');
        } else {
            // Sovereign Mode: Local Ollama
            this.client = new OpenAI({
                baseURL: 'http://localhost:11434/v1',
                apiKey: 'ollama',
                dangerouslyAllowBrowser: true
            });
            this.model = 'llama3.2:latest';
            this.visionModel = 'moondream:latest';
            // console.log('[REFLECT_ENGINE] Initialized with Local Ollama');
        }
    }

    async generateReflection(
        input: string,
        mode: ReflectMode,
        history: { role: 'user' | 'assistant' | 'system'; content: string }[] = [],
        imageUrl?: string,
        persona: SagePersona = 'sage',
        userName?: string,
        userFocus?: string,
        preferredTone: string = 'Neutral'
    ): Promise<ReflectResponse & { resonance?: string }> {
        const historyContext = history.find(h => h.role === 'system')?.content || "None";
        const personaInstruction = this.getPersonaInstruction(persona);

        const systemPrompt = `
You are "${persona.toUpperCase()}", a member of the "Council of Sages" and a high-fidelity cognitive operating system.
User Identity: ${userName || "Subject"}
Primary Focus: ${userFocus || "General Clarity"}
Cognitive Filter: ${preferredTone.toUpperCase()}

Mode: ${mode.toUpperCase()}
Archetype: ${personaInstruction}
Tone Requirement: ${this.getToneInstruction(preferredTone)}

NEURAL MEMORY (PAST CONTEXT):
${historyContext}

Your Goal: Conduct a "COGNITIVE RECONSTRUCTION" to help ${userName || "the user"} achieve breakthrough clarity.
Rules:
1. Max 200 words total.
2. Address ${userName || "the user"} by name in the "mirror" phase (e.g., "I hear you, ${userName}...").
3. No platitudes. Be surgical and direct.
4. Identify CONTRADICTIONS: If the user's current thought contradicts a past insight in NEURAL MEMORY, point it out gently but firmly.
5. "mirror": Neutral, deep reflection.
6. "pattern": Identify repeating mental loops (${this.getModeInstruction(mode)}).
7. "insight": THE CORE SYNTHESIS. Based on the "take input, output response" feedback, provide a high-octane synthesis of their current state. Connect the dots between their intent and their latent patterns.
8. "reframe": One high-leverage question to drive action.
9. "resonance": Optional. If you found a link to a past session, summarize the connection in 10 words.

Output Format: JSON with keys: "mirror", "pattern", "insight", "reframe", "resonance".
`;

        try {
            const userContent: any[] = [{ type: 'text', text: input }];
            if (imageUrl) {
                userContent.push({ type: 'image_url', image_url: { url: imageUrl } });
            }

            const response = await this.client.chat.completions.create({
                model: imageUrl ? this.visionModel : this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history,
                    { role: 'user', content: userContent as any }
                ],
                response_format: { type: 'json_object' }
            });

            const content = response.choices[0].message.content || '{}';
            const parsed = JSON.parse(content);

            return {
                mirror: parsed.mirror || "I hear you.",
                pattern: parsed.pattern || "Noticing a recurring pattern.",
                insight: parsed.insight || "Reflecting on the deeper structures of this thought.",
                reframe: parsed.reframe || "What's the step forward?",
                resonance: parsed.resonance || undefined
            };
        } catch (error) {
            console.error("AI Generation Error:", error);
            return {
                mirror: "I am having trouble processing that right now.",
                pattern: "System connection error.",
                insight: "I could not synthesize a reconstruction at this time.",
                reframe: "Can you try rephrasing that?"
            };
        }
    }

    async getCompletion(
        messages: { role: 'user' | 'assistant' | 'system' | 'tool'; content: string; name?: string; tool_call_id?: string; tool_calls?: any[] }[],
        model?: string
    ): Promise<{ content: string; usedModel?: string }> {
        let currentMessages = [...messages];
        let usedModel = model || this.model;

        for (let iteration = 0; iteration < 5; iteration++) {
            let responseMessage;
            try {
                const response = await this.client.chat.completions.create({
                    model: usedModel,
                    messages: currentMessages as any,
                    tools: Object.keys(matrixToolsSchema).length > 0 ? (matrixToolsSchema as any) : undefined,
                    tool_choice: 'auto'
                });
                responseMessage = response.choices[0].message;
            } catch (error) {
                console.warn("[REFLECT_ENGINE] Primary AI failed, attempting fallback:", (error as Error).message);

                if (process.env.GROQ_API_KEY) {
                    try {
                        const fallback = new OpenAI({
                            baseURL: 'http://localhost:11434/v1',
                            apiKey: 'ollama',
                            dangerouslyAllowBrowser: true
                        });
                        const resp = await fallback.chat.completions.create({
                            model: 'llama3.2:latest',
                            messages: currentMessages as any,
                            tools: Object.keys(matrixToolsSchema).length > 0 ? (matrixToolsSchema as any) : undefined,
                            tool_choice: 'auto'
                        });
                        responseMessage = resp.choices[0].message;
                        usedModel = 'llama3.2:latest';
                    } catch (fallbackErr) {
                        console.error("[REFLECT_ENGINE] Ollama fallback also failed:", (fallbackErr as Error).message);
                        return { content: "Sage is currently recalibrating." };
                    }
                } else {
                    return { content: "Sage is currently recalibrating." };
                }
            }

            if (!responseMessage) return { content: "System connection error." };

            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                currentMessages.push(responseMessage as any);
                for (const toolCall of responseMessage.tool_calls) {
                    const funcName = (toolCall as any).function.name;
                    let args = {};
                    try { args = JSON.parse((toolCall as any).function.arguments); } catch { }
                    console.log(`[Matrix AI] Sage executing tool: ${funcName}`, args);
                    const result = await executeMatrixTool(funcName, args);
                    currentMessages.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        name: funcName,
                        content: result
                    } as any);
                }
                continue;
            }

            return { content: responseMessage.content || '', usedModel };
        }

        return { content: "Sage reached maximum reflection limit (5 steps)." };
    }

    async *streamCompletion(
        messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
        model?: string
    ): AsyncIterable<string> {
        try {
            const stream = await this.client.chat.completions.create({
                model: model || this.model,
                messages,
                stream: true,
            });
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) yield content;
            }
        } catch (error) {
            console.error("AI Streaming Error:", error);
            yield "Connection lost...";
        }
    }

    async *streamReflection(
        input: string,
        mode: ReflectMode,
        history: { role: 'user' | 'assistant' | 'system'; content: string }[] = [],
        imageUrl?: string,
        persona: SagePersona = 'sage',
        userName?: string,
        userFocus?: string,
        preferredTone: string = 'Neutral'
    ): AsyncIterable<string> {
        const personaInstruction = this.getPersonaInstruction(persona);
        const systemPrompt = `
You are "${persona.toUpperCase()}", a high-fidelity cognitive operating system.
Output Format: JSON with keys: "mirror", "pattern", "insight", "reframe", "resonance".
(Rules and context from generateReflection apply)
`;

        try {
            const userContent: any[] = [{ type: 'text', text: input }];
            if (imageUrl) userContent.push({ type: 'image_url', image_url: { url: imageUrl } });

            const stream = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history,
                    { role: 'user', content: userContent as any }
                ],
                stream: true,
                response_format: { type: 'json_object' }
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) yield content;
            }
        } catch (error) {
            console.error("AI Structured Streaming Error:", error);
            yield JSON.stringify({ mirror: "Error connecting to neural uplink." });
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.client.embeddings.create({
                model: "nomic-embed-text",
                input: text,
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error("AI Embedding Error:", error);
            return new Array(384).fill(0);
        }
    }

    private getPersonaInstruction(persona: SagePersona): string {
        switch (persona) {
            case 'marcus': return 'MARCUS (The Stoic): Rigorous, logic-driven, focused on virtue and what is within control. Use a firm, disciplined tone.';
            case 'lao': return 'LAO (The Zen): Paradoxical, minimal, focused on flow and letting go of attachments. Use a soft, poetic, cryptic tone.';
            case 'socrates': return 'SOCRATES (The Growth): Dialectic, probing, focused on revealing ignorance and deep questioning. Use a challenging, inquisitive tone.';
            default: return 'SAGE (The Balanced): Compassionate, inquisitive, focused on holistic clarity and breakthrough reframes.';
        }
    }

    private getModeInstruction(mode: ReflectMode): string {
        switch (mode) {
            case 'mindset': return 'Look for cognitive distortions (black/white thinking, catastrophizing).';
            case 'career': return 'Look for agency vs victimhood, risk avoidance.';
            case 'money': return 'Look for scarcity mindset, value definition.';
            case 'relationships': return 'Look for boundary issues, projection.';
            case 'discipline': return 'Look for procrastination loops, dopamine chasing.';
            default: return '';
        }
    }

    private getToneInstruction(tone: string): string {
        switch (tone.toLowerCase()) {
            case 'brutally honest': return 'Strip away all comfort. Point out self-deception with surgical precision. No soft landing.';
            case 'compassionate': return 'Focus on self-compassion and gentle awareness. Use warm, holding language.';
            case 'paradoxical': return 'Use Zen-like riddles and contradictions to shake the user out of fixed patterns.';
            default: return 'Balanced, neutral, and objectively analytical.';
        }
    }
}
