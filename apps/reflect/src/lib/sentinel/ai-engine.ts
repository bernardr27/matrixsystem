export type SentinelAction = 'repair_auth' | 'repair_network' | 'clear_cache' | 'reload' | 'none';

export interface SentinelAnalysis {
    insight: string;
    action: SentinelAction;
    confidence: number;
}

export class SentinelAI {
    /**
     * Analyzes an error message to provide intelligent insights and repair suggestions.
     * Currently uses heuristic pattern matching, but designed to be upgradeable to LLM-based analysis.
     */
    /**
     * Analyzes an error message using the Local Llama 3.2 Model for "Sovereign" insights.
     * Falls back to heuristics if the Matrix is offline.
     */
    static async analyzeWithMatrix(errorMessage: string): Promise<SentinelAnalysis> {
        try {
            // Client-side: route through API proxy (mobile-safe)
            // Server-side: hit Ollama directly
            const isClient = typeof window !== 'undefined';
            const url = isClient
                ? '/api/sentinel/analyze'
                : 'http://localhost:11434/api/chat';

            if (isClient) {
                // Use the API proxy route
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ errorMessage })
                });

                if (!response.ok) throw new Error('Sentinel API offline');
                const data = await response.json();

                if (data.insight && data.action) {
                    return {
                        insight: data.insight,
                        action: data.action,
                        confidence: data.confidence || 0.9
                    };
                }
            } else {
                // Server-side: call Ollama directly
                const response = await fetch(url, {
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
                    })
                });

                if (!response.ok) throw new Error('Matrix Offline');
                const data = await response.json();
                const content = data.message.content;

                // Extract JSON from potential markdown wrappers
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

                if (parsed && parsed.insight && parsed.action) {
                    return {
                        insight: parsed.insight,
                        action: parsed.action,
                        confidence: parsed.confidence || 0.9
                    };
                }
            }
        } catch (e) {
            console.warn('[Sentinel] Matrix Link Unstable, falling back to heuristics.');
        }

        // Fallback to original heuristics
        return this.analyzeHeuristic(errorMessage);
    }

    static analyzeHeuristic(errorMessage: string): SentinelAnalysis {
        const msg = errorMessage.toLowerCase();

        // 1. Auth/Session Issues
        if (msg.includes('auth') || msg.includes('jwt') || msg.includes('token') || msg.includes('session')) {
            return {
                insight: "It looks like your security token has expired or become desynchronized with the server.",
                action: 'repair_auth',
                confidence: 0.9
            };
        }

        // 2. Network/Connection Issues
        if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection') || msg.includes('offline')) {
            return {
                insight: "The neural link to the cloud seems unstable. This is likely a temporary network fluctuation.",
                action: 'repair_network',
                confidence: 0.85
            };
        }

        // 3. Rendering/React Issues
        if (msg.includes('minified') || msg.includes('render') || msg.includes('hydration')) {
            return {
                insight: "A visual rendering anomaly occurred. This is usually fixed by refreshing the interface cache.",
                action: 'reload',
                confidence: 0.8
            };
        }

        // 4. Database/Data Issues
        if (msg.includes('foreign key') || msg.includes('duplicate') || msg.includes('constraint')) {
            return {
                insight: "A data integrity conflict was detected. The system prevented a potential corruption event.",
                action: 'clear_cache',
                confidence: 0.75
            };
        }

        // Default Fallback
        return {
            insight: "An unstructured anomaly was detected. The specific cause is currently ambiguous.",
            action: 'none',
            confidence: 0.3
        };
    }

    /**
     * @deprecated Use analyzeWithMatrix for AI-powered insights. This is the legacy sync methods.
     */
    static analyze(errorMessage: string): SentinelAnalysis {
        return this.analyzeHeuristic(errorMessage);
    }

    /**
     * Executes a self-repair action based on the recommended strategy.
     */
    static async executeRepair(action: SentinelAction): Promise<boolean> {
        if (typeof window === 'undefined') return false;

        

        switch (action) {
            case 'repair_auth':
                // Surgically remove only auth tokens
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                        localStorage.removeItem(key);
                    }
                });
                return true;

            case 'repair_network':
                // Check online status (simple diagnostic)
                return navigator.onLine;

            case 'clear_cache':
                // clear non-essential cache
                localStorage.removeItem('reflect-query-cache'); // Example key
                return true;

            case 'reload':
                window.location.reload();
                return true;

            case 'none':
            default:
                return false;
        }
    }
}
