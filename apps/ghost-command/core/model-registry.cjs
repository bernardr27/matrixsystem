const axios = require('axios');

class ModelRegistry {
    constructor(supabase, registry) {
        this.supabase = supabase;
        this.registry = registry;
        this.ollamaUrl = process.env.AI_BASE_URL || 'http://localhost:11434';
        this.checkInterval = 300000; // Check models every 5 minutes
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🧠 [MODEL_REGISTRY] Local Intelligence Discovery Active');
        this.checkModels();
        this.interval = setInterval(() => this.checkModels(), this.checkInterval);
    }

    async checkModels() {
        try {
            console.log('[MODEL_REGISTRY] 🔍 Probing local model availability (Ollama)...');
            const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 3000 });
            const models = response.data.models || [];

            const modelNames = models.map(m => m.name);
            console.log(`[MODEL_REGISTRY] Found ${modelNames.length} local models: ${modelNames.join(', ')}`);

            // Update instance metadata in Supabase via RegistryClient
            await this.registry.updateMetadata({
                local_models: modelNames,
                inference_provider: 'ollama',
                last_model_check: new Date().toISOString()
            });

        } catch (err) {
            console.warn('[MODEL_REGISTRY] Local model probe failed:', err.message);
            // Update metadata to reflect offline status for models
            await this.registry.updateMetadata({
                local_models: [],
                inference_provider: null,
                last_model_check: new Date().toISOString()
            });
        }
    }

    stop() {
        this.isRunning = false;
        if (this.interval) clearInterval(this.interval);
    }
}

module.exports = ModelRegistry;
