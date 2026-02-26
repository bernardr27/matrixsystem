/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  MATRIX STRUCTURED LOGGER — Replaces raw console.log               ║
 * ║  Uses pino for JSON-structured, level-aware logging                 ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

let pino;
try {
    pino = require('pino');
} catch {
    // Fallback if pino is not installed
    pino = null;
}

const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Create a structured logger for a Matrix service.
 * Falls back to console-based logging if pino is unavailable.
 * @param {string} service - Service name (e.g., 'sentinel', 'ghost-runner')
 */
function createLogger(service) {
    if (pino) {
        return pino({
            name: service,
            level: IS_DEV ? 'debug' : 'info',
            transport: IS_DEV ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss',
                    ignore: 'pid,hostname',
                    messageFormat: `\x1b[36m[${service.toUpperCase()}]\x1b[0m {msg}`,
                },
            } : undefined,
        });
    }

    // Console fallback with structured-ish output
    const PREFIX = `\x1b[36m[${service.toUpperCase()}]\x1b[0m`;
    return {
        info: (msg, data) => console.log(`${PREFIX} ${msg}`, data || ''),
        warn: (msg, data) => console.warn(`\x1b[33m${PREFIX} ${msg}\x1b[0m`, data || ''),
        error: (msg, data) => console.error(`\x1b[31m${PREFIX} ${msg}\x1b[0m`, data || ''),
        debug: (msg, data) => IS_DEV && console.log(`\x1b[90m${PREFIX} ${msg}\x1b[0m`, data || ''),
        fatal: (msg, data) => console.error(`\x1b[41m${PREFIX} FATAL: ${msg}\x1b[0m`, data || ''),
        child: (bindings) => createLogger(`${service}:${Object.values(bindings).join(':')}`),
    };
}

module.exports = { createLogger };
