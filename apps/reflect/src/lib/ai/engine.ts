import { OpenAICompatibleProvider } from './providers/openai';
import { MockEngine } from './providers/mock';
import { AIProvider } from './types';
import { isSafeMode } from '../safe-mode';

// Default configuration (Safe defaults if env vars missing)
const BASE_URL = process.env.AI_BASE_URL || process.env.NEXT_PUBLIC_AI_BASE_URL || 'http://localhost:11434/v1';
const API_KEY = process.env.AI_API_KEY || process.env.NEXT_PUBLIC_AI_API_KEY || 'ollama';
const MODEL_ID = process.env.AI_MODEL || process.env.NEXT_PUBLIC_AI_MODEL_ID || 'llama3';

export function getEngine(config?: { url?: string; apiKey?: string; model?: string; provider?: string }): AIProvider {
    if (isSafeMode()) {
        return new MockEngine();
    }

    // High Priority: Local Ollama (Always prefer if found or explicitly requested)
    const isLocalExplicit = config?.provider === 'local';
    const hasLocalUrl = !!config?.url && config.url.includes('localhost');
    const useLocal = isLocalExplicit || hasLocalUrl || (!config?.provider && !process.env.AI_API_KEY);

    if (useLocal) {
        return new OpenAICompatibleProvider(
            config?.url || 'http://localhost:11434/v1',
            'ollama',
            config?.model || 'llama3.2'
        );
    }

    return new OpenAICompatibleProvider(
        config?.url || BASE_URL,
        config?.apiKey || API_KEY,
        config?.model || MODEL_ID
    );
}

export const reflectEngine = getEngine();

export async function getCompletion(messages: { role: 'user' | 'assistant' | 'system'; content: string }[], config?: any) {
    const engine = getEngine(config);
    return engine.getCompletion(messages, config?.model);
}
