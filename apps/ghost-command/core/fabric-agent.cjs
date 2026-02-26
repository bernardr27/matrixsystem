/**
 * Fabric Agent — Pattern-Based Micro-Automation
 * 
 * Loads AI system prompts ("patterns") from markdown files to execute 
 * specialized background tasks with high consistency.
 * 
 * Part of Matrix Phase 38: Neural Swarm Optimization
 */

const fs = require('fs');
const path = require('path');
const EventLogger = require('./event-logger.cjs');

class FabricAgent {
    constructor(supabase, config = {}) {
        this.supabase = supabase;
        this.config = config;
        this.patternsDir = path.join(__dirname, 'patterns');
        this.citadelUrl = process.env.CITADEL_URL || 'http://localhost:3005';
    }

    /**
     * Internal: Call Matrix Neural Mesh
     */
    async meshCall(messages, options = {}) {
        try {
            const response = await fetch(`${this.citadelUrl}/api/neural`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'chat',
                    messages,
                    options
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Neural Mesh Error: ${response.status} - ${errorBody}`);
            }
            const data = await response.json();
            return data.response;
        } catch (err) {
            console.error('[FABRIC_AGENT] Mesh call failed:', err.message);
            return null;
        }
    }

    /**
     * List all available patterns
     */
    listPatterns() {
        if (!fs.existsSync(this.patternsDir)) return [];
        return fs.readdirSync(this.patternsDir)
            .filter(f => f.endsWith('.md'))
            .map(f => f.replace('.md', ''));
    }

    /**
     * Execute a specific pattern with given input
     */
    async executePattern(patternName, input) {
        const patternPath = path.join(this.patternsDir, `${patternName}.md`);

        if (!fs.existsSync(patternPath)) {
            throw new Error(`Fabric Error: Pattern '${patternName}' not found in ${this.patternsDir}`);
        }

        console.log(`🧠 [FABRIC] Executing pattern: ${patternName}...`);
        const systemPrompt = fs.readFileSync(patternPath, 'utf8');

        const response = await this.meshCall([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input || 'Analyze the provided context.' }
        ], {
            temperature: 0.2,
            model: 'llama-3.3-70b-versatile'
        });

        if (EventLogger) {
            EventLogger.info('fabric_agent', 'pattern_executed', `Executed fabric pattern: ${patternName}`, {
                pattern: patternName,
                inputLength: input?.length || 0
            });
        }

        return response;
    }
}

module.exports = FabricAgent;
