import { AIProvider, ReflectMode, ReflectResponse, SagePersona } from '../types';
import { MOCK_AI_RESPONSE } from '@/lib/debug/mocks';

export class MockEngine implements AIProvider {
    async generateReflection(
        input: string,
        mode: ReflectMode,
        history: any[] = [],
        imageUrl?: string,
        persona: SagePersona = 'sage',
        userName?: string,
        userFocus?: string
    ): Promise<ReflectResponse & { resonance?: string }> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            mirror: `[${persona.toUpperCase()} // ${mode.toUpperCase()}] I hear you, ${userName || 'Subject'}. ${MOCK_AI_RESPONSE.mirror}`,
            pattern: input.length > 20 ? MOCK_AI_RESPONSE.pattern : "Please say more.",
            insight: MOCK_AI_RESPONSE.insight,
            reframe: MOCK_AI_RESPONSE.reframe,
            resonance: "Historical resonance detected."
        };
    }
    async getCompletion(messages: any[], model?: string): Promise<{ content: string }> {
        // Mock Chat
        const lastUser = messages.reverse().find((m: any) => m.role === 'user')?.content || '';
        return { content: `[Mock AI] I see you asked: "${lastUser}". Here is a wise answer based on your journal context.` };
    }

    async *streamCompletion(messages: any[], model?: string): AsyncIterable<string> {
        const text = "[Mock AI Streaming] This is a simulated real-time response to your inquiry.";
        const words = text.split(' ');
        for (const word of words) {
            await new Promise(resolve => setTimeout(resolve, 50));
            yield word + ' ';
        }
    }

    async *streamReflection(
        input: string,
        mode: ReflectMode,
        history: any[] = [],
        imageUrl?: string,
        persona: SagePersona = 'sage',
        userName?: string,
        userFocus?: string
    ): AsyncIterable<string> {
        const mockResponse = {
            mirror: `[${persona.toUpperCase()}] I hear you, ${userName || 'Subject'}.`,
            pattern: "Noticing a recurring pattern in your input.",
            insight: "This reveals a deeper connection to your goals.",
            reframe: "How can we leverage this today?",
            resonance: "Historical resonance detected."
        };

        const jsonString = JSON.stringify(mockResponse);
        const chunks = jsonString.match(/.{1,10}/g) || [];
        for (const chunk of chunks) {
            await new Promise(resolve => setTimeout(resolve, 30));
            yield chunk;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        // Return a mock vector of 384 dimensions
        return new Array(384).fill(0).map((_, i) => Math.sin(i + text.length));
    }
}
