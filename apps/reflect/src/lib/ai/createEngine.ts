import { getEngine } from './engine';
import { AIProvider } from './types';

/**
 * createEngine (Legacy Alias)
 * 
 * Satisfies legacy imports while routing execution to the new getEngine system.
 * This ensures total system stability across historical and future neural loops.
 */
export function createEngine(config?: { url?: string; apiKey?: string; model?: string; provider?: string }): AIProvider {
    return getEngine(config);
}

// Default export for generic factory usage
export default createEngine;
