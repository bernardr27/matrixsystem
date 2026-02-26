import OpenAI from 'openai';

// We must create an independent OpenAI instance strictly for embeddings
// because the main engine relies on Groq cloud routing.
let openaiClient: OpenAI | null = null;

export async function getEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is missing. Cannot generate embeddings.");
    }

    if (!openaiClient) {
        openaiClient = new OpenAI({ apiKey });
    }

    // Replace newlines, which can negatively affect embedding performance
    const input = text.replace(/\n/g, ' ');

    const response = await openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: input,
        encoding_format: 'float',
    });

    return response.data[0].embedding;
}
