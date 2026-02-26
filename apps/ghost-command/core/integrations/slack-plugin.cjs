/**
 * Slack Integration Plugin
 * Sends notifications to Slack channels via webhooks
 */

class SlackPlugin {
    constructor() {
        this.name = 'slack';
        this.type = 'notification';
        this.rateLimit = 60; // 60 requests per minute
    }

    /**
     * Execute Slack action
     * @param {string} action - Action to perform ('notify', 'send_message')
     * @param {object} params - Action parameters
     * @param {object} config - Integration configuration from database
     */
    async execute(action, params, config) {
        const webhookUrl = config.credentials?.webhook_url;

        if (!webhookUrl) {
            throw new Error('Slack webhook URL not configured');
        }

        switch (action) {
            case 'notify':
            case 'send_message':
                return await this.sendMessage(webhookUrl, params);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Send message to Slack
     */
    async sendMessage(webhookUrl, params) {
        const { message, severity = 'info', title, fields = [] } = params;

        const color = this.getSeverityColor(severity);
        const icon = this.getSeverityIcon(severity);

        const payload = {
            text: title || 'Matrix System Notification',
            attachments: [{
                color,
                title: `${icon} ${title || 'System Alert'}`,
                text: message,
                fields: fields.map(f => ({
                    title: f.title,
                    value: f.value,
                    short: f.short !== false
                })),
                footer: 'Matrix Intelligence System',
                footer_icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=matrix',
                ts: Math.floor(Date.now() / 1000)
            }]
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Slack API error: ${response.status} - ${error}`);
        }

        return { sent: true, timestamp: Date.now() };
    }

    getSeverityColor(severity) {
        const colors = {
            critical: '#DC2626',  // Red
            high: '#EA580C',      // Orange
            warning: '#F59E0B',   // Amber
            medium: '#10B981',    // Green
            info: '#3B82F6',      // Blue
            low: '#6B7280'        // Gray
        };
        return colors[severity] || colors.info;
    }

    getSeverityIcon(severity) {
        const icons = {
            critical: '🚨',
            high: '⚠️',
            warning: '⚡',
            medium: 'ℹ️',
            info: '💡',
            low: '📌'
        };
        return icons[severity] || icons.info;
    }
}

module.exports = SlackPlugin;
