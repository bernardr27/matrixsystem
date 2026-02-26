/**
 * Phase 17: System Event Logger
 * 
 * Centralized event bus that logs significant system events
 * to Supabase system_events table for real-time streaming
 * to Matrix Hub dashboard.
 */

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);



// Severity levels: info, warning, error, critical
const EventLogger = {
    _buffer: [],
    _flushTimer: null,
    _flushInterval: 5000, // 5 second buffer
    _hub: null,

    /**
     * Link to IntegrationHub for external alerts (Telegram/Discord)
     */
    setHub(hub) {
        this._hub = hub;
    },

    /**
     * Log a system event
     */
    async log(source, eventType, message, severity = 'info', metadata = null) {
        const event = {
            source,
            event_type: eventType,
            message,
            severity,
            metadata: metadata ? JSON.stringify(metadata) : null,
            timestamp: new Date().toISOString()
        };

        this._buffer.push(event);
        console.log(`  📝 [EVENT] ${severity.toUpperCase()} | ${source} | ${eventType}: ${message}`);

        // Flush immediately for critical/error
        if (severity === 'critical' || severity === 'error') {
            await this.flush();

            // --- EXTERNAL ALERTING ---
            if (this._hub) {
                const emoji = severity === 'critical' ? '🚨' : '⚠️';
                const alertMsg = `${emoji} [${severity.toUpperCase()}] ${source}: ${message}`;

                // Blast to Telegram if it's a critical/error event and hub is available
                this._hub.execute('telegram', 'send', { message: alertMsg }).catch(() => { });
                this._hub.execute('discord', 'send', { message: alertMsg }).catch(() => { });
            }
        } else if (!this._flushTimer) {
            this._flushTimer = setTimeout(() => this.flush(), this._flushInterval);
        }
    },

    /**
     * Flush buffered events to Supabase
     */
    async flush() {
        if (this._buffer.length === 0) return;

        const events = [...this._buffer];
        this._buffer = [];
        this._flushTimer = null;

        try {
            const { error } = await supabase.from('system_events').insert(events);
            if (error) {
                console.error('[EVENT_LOGGER] Flush error:', error.message);
                // Put events back
                this._buffer.unshift(...events);
            }
        } catch (err) {
            console.error('[EVENT_LOGGER] Flush failed:', err.message);
            this._buffer.unshift(...events);
        }
    },

    // Convenience methods
    info(source, type, message, meta) { return this.log(source, type, message, 'info', meta); },
    warn(source, type, message, meta) { return this.log(source, type, message, 'warning', meta); },
    error(source, type, message, meta) { return this.log(source, type, message, 'error', meta); },
    critical(source, type, message, meta) { return this.log(source, type, message, 'critical', meta); },

    // System lifecycle events
    boot(service) { return this.info(service, 'boot', `${service} started successfully`); },
    shutdown(service) { return this.warn(service, 'shutdown', `${service} shutting down`); },
    recovery(service, detail) { return this.warn(service, 'recovery', `Auto-recovered: ${detail}`); },
    healthCheck(service, healthy, meta) {
        return healthy
            ? this.info(service, 'health_check', `${service} healthy`, meta)
            : this.error(service, 'health_check', `${service} UNHEALTHY`, meta);
    }
};

module.exports = EventLogger;
