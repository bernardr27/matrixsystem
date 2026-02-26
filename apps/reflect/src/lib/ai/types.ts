
export type ReflectMode = 'mindset' | 'career' | 'money' | 'relationships' | 'discipline' | 'capsule';
export type SagePersona = 'sage' | 'marcus' | 'lao' | 'socrates';

export interface ReflectResponse {
    mirror: string;
    pattern: string;
    insight: string;
    reframe: string;
}

export interface AIProvider {
    /**
     * Generates a structured reflection based on the user's input and context.
     */
    generateReflection(
        input: string,
        mode: ReflectMode,
        history?: { role: 'user' | 'assistant' | 'system'; content: string }[],
        imageUrl?: string,
        persona?: SagePersona,
        userName?: string,
        userFocus?: string,
        preferredTone?: string
    ): Promise<ReflectResponse & { resonance?: string }>;

    /**
     * Raw chat completion for generic queries (RAG).
     */
    getCompletion(
        messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
        model?: string
    ): Promise<{ content: string }>;

    /**
     * Streams a completion.
     */
    streamCompletion(
        messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
        model?: string
    ): AsyncIterable<string>;

    /**
     * Streams a structured reflection.
     * Since this is JSON, it will yield partial JSON strings or events.
     */
    streamReflection(
        input: string,
        mode: ReflectMode,
        history?: { role: 'user' | 'assistant' | 'system'; content: string }[],
        imageUrl?: string,
        persona?: SagePersona,
        userName?: string,
        userFocus?: string,
        preferredTone?: string
    ): AsyncIterable<string>;

    /**
     * Generates a vector embedding for the given text.
     */
    generateEmbedding(text: string): Promise<number[]>;
}
