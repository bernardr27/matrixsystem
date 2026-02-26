export interface NeuralCompletionOptions {
    model?: string;
    messages: any[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    forceLocal?: boolean;
    preferLocal?: boolean;
}

export class NeuralMesh {
    private static OLLAMA_URL = process.env.AI_BASE_URL || 'http://localhost:11434';
    private static GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    static async getCompletion(options: NeuralCompletionOptions) {
        // 1. Force Local check
        if (options.forceLocal) {
            return this.getSwarmInference(options);
        }

        // 2. Try Groq first for high-performance reasoning (unless preferLocal)
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey && !options.preferLocal) {
            try {
                const response = await fetch(this.GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${groqKey}`
                    },
                    body: JSON.stringify({
                        model: options.model || 'llama-3.3-70b-versatile',
                        messages: options.messages,
                        max_tokens: options.max_tokens || 2048,
                        temperature: options.temperature || 0.7,
                        stream: options.stream || false
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.choices[0].message.content;
                }
            } catch (err) {
                console.warn("[NEURAL_MESH] Groq Cloud failed, falling back to Swarm Intelligence:", err);
            }
        }

        // 3. Fallback to Swarm-wide Distributed Inference
        return this.getSwarmInference(options);
    }

    private static async getSwarmInference(options: NeuralCompletionOptions) {
        // First try local node
        try {
            const response = await fetch(`${this.OLLAMA_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: options.model || process.env.AI_CHAT_MODEL || 'llama3.2:latest',
                    messages: options.messages,
                    stream: false,
                    options: { temperature: options.temperature || 0.7, num_ctx: 8192 }
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.message.content;
            }
        } catch (err) {
            console.warn("[NEURAL_MESH] Local inference failed, probing Swarm Nodes...");
        }

        // Distributed Fallback logic would go here (requires cross-node API discovery)
        // For Phase 43, we ensure the local fallback is robust and the Citadel API 
        // can receive and route these requests if called from another node.

        throw new Error("Neural synchronization failed: All distributed providers offline.");
    }

    static async getEmbedding(text: string) {
        try {
            const response = await fetch(`${this.OLLAMA_URL}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'mxbai-embed-large',
                    prompt: text
                })
            });

            if (!response.ok) throw new Error(`Embedding error: ${response.statusText}`);
            const data = await response.json();
            return data.embedding;
        } catch (err) {
            console.error("[NEURAL_MESH] Embedding generation failed:", err);
            throw err;
        }
    }
}
