/* eslint-disable no-useless-escape */
const ALLOWED_BRIDGE_STATUSES = new Set([
    'pending',
    'executing',
    'executed',
    'completed',
    'failed',
    'silent',
    'complete',
    'processing',
    'verifying'
]);

const COMMAND_ALIASES = {
    'sys:start': 'sys:ignite',
    'sys:boot_all': 'sys:ignite',
    'sys:shutdown': 'sys:kill_all',
    'sys:stop': 'sys:kill_all',
    'sys:restart': 'sys:restart_all',
    'sys:open_gate_all': 'sys:open_all_gates',
    'sys:close_gate_all': 'sys:close_all_gates',
    'sys:autopilot_quick': 'sys:autopilot'
};

function normalizeCommand(action) {
    const key = String(action || '').trim().toLowerCase();
    return COMMAND_ALIASES[key] || String(action || '').trim();
}

function isCanonicalSystemCommand(action, handledCommands) {
    if (!action || typeof action !== 'string') return false;
    if (Array.isArray(handledCommands) && handledCommands.includes(action)) return true;

    const patterns = [
        /^sys:(start|stop|restart)_[a-z0-9_]+$/i,
        /^sys:(local|cloud)_(start|stop|restart)_[a-z0-9_]+$/i,
        /^sys:(open|close)_gate(_[a-z0-9_]+)?$/i,
        /^triage:[a-z0-9_]+$/i,
        /^fs:[a-z0-9_]+(\s+.+)?$/i,
        /^transfer:[a-z0-9_]+(\s+.+)?$/i
    ];
    return patterns.some((rx) => rx.test(action));
}

function validateBridgeEnvelope(cmd, handledCommands) {
    if (!cmd || typeof cmd !== 'object') return { ok: false, reason: 'invalid_record' };
    const id = String(cmd.id || '').trim();
    const command = String(cmd.command || '').trim();
    const source = String(cmd.source || '').trim();
    const status = String(cmd.status || '').trim().toLowerCase();

    if (!id) return { ok: false, reason: 'missing_id' };
    if (!command) return { ok: false, reason: 'missing_command' };
    if (!source) return { ok: false, reason: 'missing_source' };
    if (!ALLOWED_BRIDGE_STATUSES.has(status)) return { ok: false, reason: `invalid_status:${status || 'empty'}` };
    if (/\r|\n|\t/.test(command)) return { ok: false, reason: 'invalid_command_whitespace' };
    if (!isCanonicalSystemCommand(command, handledCommands)) return { ok: false, reason: 'non_canonical_command' };
    return { ok: true };
}

module.exports = {
    COMMAND_ALIASES,
    ALLOWED_BRIDGE_STATUSES,
    normalizeCommand,
    isCanonicalSystemCommand,
    validateBridgeEnvelope
};
