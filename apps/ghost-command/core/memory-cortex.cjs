/**
 * CHRONOS MEMORY CORTEX (v1.0.0)
 * Persistent contextual memory for Matrix AI.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

class MemoryCortex {
    constructor() {
        this.memoryPath = path.join(process.cwd(), 'core', 'memory_vault.json');
        this.memories = this.loadMemory();
    }

    loadMemory() {
        if (!fs.existsSync(this.memoryPath)) {
            return {
                interactions: [],
                missions: [],
                context: {}
            };
        }
        try {
            return JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
        } catch (e) {
            return { interactions: [], missions: [], context: {} };
        }
    }

    saveMemory() {
        fs.writeFileSync(this.memoryPath, JSON.stringify(this.memories, null, 2));
    }

    /**
     * Record an AI-User interaction.
     */
    async logInteraction(role, content) {
        const embedding = await this.generateEmbedding(content);
        console.log(`[MEMORY] 📁 Interactions count BEFORE: ${this.memories.interactions.length}`);
        this.memories.interactions.push({
            timestamp: new Date().toISOString(),
            role,
            content,
            embedding
        });
        console.log(`[MEMORY] 📁 Interactions count AFTER: ${this.memories.interactions.length}`);

        // Limit context to last 100 interactions for vector search
        if (this.memories.interactions.length > 100) {
            this.memories.interactions.shift();
        }
        this.saveMemory();
    }

    async generateEmbedding(text) {
        console.log(`[MEMORY] 🧠 Generating embedding for: "${text.substring(0, 30)}..."`);
        return new Promise((resolve, reject) => {
            const payload = JSON.stringify({
                model: 'nomic-embed-text',
                prompt: text
            });

            const options = {
                hostname: 'localhost',
                port: 11434,
                path: '/api/embeddings',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        console.log(`[MEMORY] ✅ Embedding received (length: ${result.embedding?.length || 'NULL'})`);
                        resolve(result.embedding);
                    } catch (e) {
                        console.error('[MEMORY] Failed to parse embedding:', e.message);
                        resolve(null);
                    }
                });
            });

            req.on('error', (e) => {
                console.error('[MEMORY] ❌ Embedding API error:', e.message);
                resolve(null);
            });
            req.write(payload);
            req.end();

            // Timeout after 30s for slow LLM/first load
            setTimeout(() => {
                console.warn('[MEMORY] ⏳ Embedding request timed out after 30s.');
                resolve(null);
            }, 30000);
        });
    }

    /**
     * Find semantically similar interactions.
     */
    async findSimilar(query, limit = 3) {
        const queryEmbedding = await this.generateEmbedding(query);
        if (!queryEmbedding) return [];

        const scored = this.memories.interactions
            .filter(m => m.embedding)
            .map(m => ({
                ...m,
                score: this.cosineSimilarity(queryEmbedding, m.embedding)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return scored;
    }

    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Record a mission outcome.
     */
    async logMission(mission) {
        this.memories.missions.push({
            id: mission.id,
            title: mission.title,
            timestamp: new Date().toISOString(),
            status: mission.status
        });
        if (this.memories.missions.length > 100) {
            this.memories.missions.shift();
        }
        this.saveMemory();
    }

    /**
     * Get relevant context for the current prompt.
     */
    async getContextSnippet(prompt) {
        // 1. Get recent context
        const recent = this.memories.interactions.slice(-3);

        // 2. Get semantic context
        const similar = await this.findSimilar(prompt, 2);

        const combined = [...similar, ...recent];
        // Deduplicate by timestamp
        const unique = Array.from(new Map(combined.map(m => [m.timestamp, m])).values())
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (unique.length === 0) return "No previous context.";

        return unique.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    }
}

module.exports = new MemoryCortex();
