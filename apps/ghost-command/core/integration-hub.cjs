const EventEmitter = require('events');
let EventLogger;
try { EventLogger = require('./event-logger.cjs'); } catch { EventLogger = null; }

class IntegrationHub extends EventEmitter {
    constructor(supabase) {
        super();
        this.supabase = supabase;
        this.plugins = new Map();
        this.rateLimiters = new Map();
    }

    /**
     * Local/env fallback for critical integrations when DB config is absent.
     */
    getFallbackConfig(integrationName) {
        if (integrationName !== 'github') return null;
        const token = process.env.GITHUB_TOKEN;
        if (!token) return null;

        let owner = 'bernardr27';
        let repo = 'matrixsystem';
        if (process.env.GITHUB_REPO) {
            const parts = process.env.GITHUB_REPO.split('/');
            if (parts.length === 2) {
                owner = parts[0];
                repo = parts[1];
            }
        }

        return {
            integration_name: 'github',
            enabled: true,
            api_key: token,
            extra_settings: { owner, repo }
        };
    }

    /**
     * Register an integration plugin
     */
    register(name, plugin) {
        if (this.plugins.has(name)) {
            console.warn(`[INTEGRATION_HUB] Plugin '${name}' already registered, overwriting`);
        }

        this.plugins.set(name, plugin);
        console.log(`[INTEGRATION_HUB] ✅ Registered plugin: ${name}`);

        // Initialize rate limiter for this plugin
        this.rateLimiters.set(name, {
            tokens: plugin.rateLimit || 60,
            maxTokens: plugin.rateLimit || 60,
            lastRefill: Date.now()
        });
    }

    /**
     * Check if integration is enabled in database
     */
    async isEnabled(integrationName) {
        try {
            const { data, error } = await this.supabase
                .from('integration_configs')
                .select('enabled')
                .eq('integration_name', integrationName)
                .single();

            if (error || !data) {
                return Boolean(this.getFallbackConfig(integrationName));
            }

            if (typeof data.enabled === 'boolean') return data.enabled;
            return Boolean(this.getFallbackConfig(integrationName));
        } catch {
            return Boolean(this.getFallbackConfig(integrationName));
        }
    }

    /**
     * Get integration configuration from database
     */
    async getConfig(integrationName) {
        try {
            const { data, error } = await this.supabase
                .from('integration_configs')
                .select('*')
                .eq('integration_name', integrationName)
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error(`[INTEGRATION_HUB] Failed to get config for ${integrationName}:`, err.message);
            const fallback = this.getFallbackConfig(integrationName);
            if (fallback) {
                console.warn(`[INTEGRATION_HUB] Using env fallback config for ${integrationName}.`);
                return fallback;
            }
            return null;
        }
    }

    /**
     * Check rate limit for integration
     */
    checkRateLimit(integrationName) {
        const limiter = this.rateLimiters.get(integrationName);
        if (!limiter) return true; // No rate limit configured

        const now = Date.now();
        const timePassed = now - limiter.lastRefill;
        const refillAmount = (timePassed / 60000) * limiter.maxTokens; // Refill per minute

        limiter.tokens = Math.min(limiter.maxTokens, limiter.tokens + refillAmount);
        limiter.lastRefill = now;

        if (limiter.tokens >= 1) {
            limiter.tokens -= 1;
            return true;
        }

        return false;
    }

    /**
     * Log integration event to database
     */
    async logEvent(integrationName, eventType, status, payload = null, response = null, error = null, duration = 0) {
        try {
            await this.supabase
                .from('integration_events')
                .insert([{
                    integration_name: integrationName,
                    event_type: eventType,
                    status,
                    payload: payload ? JSON.stringify(payload) : null,
                    response: response ? JSON.stringify(response) : null,
                    error,
                    duration_ms: duration
                }]);
        } catch (err) {
            console.error('[INTEGRATION_HUB] Failed to log event:', err.message);
        }
    }

    /**
     * Execute integration with retry logic
     */
    async execute(integrationName, action, params = {}, retries = 3) {
        const plugin = this.plugins.get(integrationName);

        if (!plugin) {
            console.error(`[INTEGRATION_HUB] Plugin '${integrationName}' not found`);
            return { success: false, error: 'Plugin not found' };
        }

        // Check if enabled
        const enabled = await this.isEnabled(integrationName);
        if (!enabled) {
            console.log(`[INTEGRATION_HUB] Plugin '${integrationName}' is disabled`);
            return { success: false, error: 'Integration disabled' };
        }

        // Check rate limit
        if (!this.checkRateLimit(integrationName)) {
            console.warn(`[INTEGRATION_HUB] Rate limit exceeded for ${integrationName}`);
            await this.logEvent(integrationName, action, 'failed', params, null, 'Rate limit exceeded');
            return { success: false, error: 'Rate limit exceeded' };
        }

        // Get configuration
        const config = await this.getConfig(integrationName);
        if (!config) {
            return { success: false, error: 'Configuration not found' };
        }

        // Execute with retry logic
        let lastError = null;
        const startTime = Date.now();

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log(`[INTEGRATION_HUB] Executing ${integrationName}.${action} (attempt ${attempt + 1}/${retries + 1})`);

                const result = await plugin.execute(action, params, config);
                const duration = Date.now() - startTime;

                await this.logEvent(integrationName, action, 'success', params, result, null, duration);

                if (EventLogger) EventLogger.info('integration_hub', 'execute_success', `${integrationName}.${action} completed in ${duration}ms`);
                this.emit('success', { integrationName, action, result });
                return { success: true, data: result };
            } catch (err) {
                lastError = err.message;
                console.error(`[INTEGRATION_HUB] ${integrationName}.${action} failed (attempt ${attempt + 1}):`, err.message);

                if (attempt < retries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`[INTEGRATION_HUB] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // All retries exhausted
        const duration = Date.now() - startTime;
        await this.logEvent(integrationName, action, 'failed', params, null, lastError, duration);

        if (EventLogger) EventLogger.error('integration_hub', 'execute_failed', `${integrationName}.${action} failed after retries: ${lastError}`);
        this.emit('failure', { integrationName, action, error: lastError });
        return { success: false, error: lastError };
    }

    /**
     * Send notification through any notification plugin
     */
    async notify(integrationName, message, options = {}) {
        return await this.execute(integrationName, 'notify', { message, ...options });
    }

    /**
     * Get health status of all integrations
     */
    async getHealthStatus() {
        try {
            const { data, error } = await this.supabase
                .from('integration_configs')
                .select('integration_name, display_name, enabled, health_status, last_success, last_failure, success_count, failure_count')
                .order('integration_name');

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[INTEGRATION_HUB] Failed to get health status:', err.message);
            return [];
        }
    }

    /**
     * Get recent events for an integration
     */
    async getEvents(integrationName, limit = 20) {
        try {
            const { data, error } = await this.supabase
                .from('integration_events')
                .select('*')
                .eq('integration_name', integrationName)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[INTEGRATION_HUB] Failed to get events:', err.message);
            return [];
        }
    }
}

module.exports = IntegrationHub;
