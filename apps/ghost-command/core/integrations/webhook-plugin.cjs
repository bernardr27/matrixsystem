/**
 * Generic Webhook Integration Plugin
 * Sends custom webhooks to any endpoint
 */

class WebhookPlugin {
    constructor() {
        this.name = 'webhook';
        this.type = 'webhook';
        this.rateLimit = 120; // Higher limit for custom webhooks
    }

    async execute(action, params, config) {
        switch (action) {
            case 'send':
            case 'post':
                return await this.sendWebhook(params, config);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    async sendWebhook(params, config) {
        const {
            url,
            method = 'POST',
            payload,
            headers = {},
            timeout = 10000
        } = params;

        const targetUrl = url || config.credentials?.default_url;

        if (!targetUrl) {
            throw new Error('Webhook URL not provided');
        }

        // Merge custom headers with default auth headers from config
        const finalHeaders = {
            'Content-Type': 'application/json',
            ...config.credentials?.headers,
            ...headers
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(targetUrl, {
                method,
                headers: finalHeaders,
                body: payload ? JSON.stringify(payload) : undefined,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const responseText = await response.text();
            let responseData;

            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = responseText;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText}`);
            }

            return {
                success: true,
                status: response.status,
                data: responseData,
                timestamp: Date.now()
            };
        } catch (err) {
            clearTimeout(timeoutId);

            if (err.name === 'AbortError') {
                throw new Error(`Webhook timeout after ${timeout}ms`);
            }
            throw err;
        }
    }
}

module.exports = WebhookPlugin;
