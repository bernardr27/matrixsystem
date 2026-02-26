import { getEngine } from './engine';
import { AIProvider } from './types';

/**
 * createngine (Typo-Safe Legacy Alias)
 * 
 * Satisfies potential malformed imports (missing 'e' in middle) 
 * by routing execution to the primary getEngine system.
 */
export function createngine(config?: { url?: string; apiKey?: string; model?: string; provider?: string }): AIProvider {
    return getEngine(config);
}

export default createngine;
