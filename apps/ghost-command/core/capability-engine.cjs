const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MATRIX_ROOT = path.resolve(__dirname, '..', '..', '..');
const REGISTRY_PATH = path.join(__dirname, 'capabilities', 'video_capability_registry.json');

function loadRegistry() {
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
    return JSON.parse(raw);
}

function getCapabilityOrThrow(registry, id) {
    const cap = registry.capabilities.find(c => c.id === id);
    if (!cap) throw new Error(`Unknown capability: ${id}`);
    return cap;
}

function timestampId() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

function makePlan(capability, target) {
    return {
        title: capability.name,
        objective: capability.summary,
        target: target || capability.target_default || 'monorepo',
        outcomes: capability.outcomes || [],
        steps: capability.steps || [],
        source: 'video_capability_registry',
        capability_id: capability.id,
        created_at: new Date().toISOString(),
    };
}

function writePlanFiles(capability, target) {
    const id = `${timestampId()}_${capability.id}`;
    const planDir = path.join(MATRIX_ROOT, 'plans', 'video_capabilities', id);
    fs.mkdirSync(planDir, { recursive: true });

    const prd = makePlan(capability, target);
    fs.writeFileSync(path.join(planDir, 'prd.json'), JSON.stringify(prd, null, 2), 'utf8');
    fs.writeFileSync(path.join(planDir, 'progress.txt'), 'PENDING\n', 'utf8');

    return { planDir, prdPath: path.join(planDir, 'prd.json') };
}

function runGateCommands(commands) {
    const results = [];
    for (const cmd of commands || []) {
        try {
            const out = execSync(cmd, {
                cwd: MATRIX_ROOT,
                stdio: 'pipe',
                encoding: 'utf8',
                windowsHide: true,
                maxBuffer: 10 * 1024 * 1024
            });
            results.push({ command: cmd, ok: true, output: out.slice(-1500) });
        } catch (err) {
            results.push({
                command: cmd,
                ok: false,
                output: `${err.stdout || ''}${err.stderr || err.message || ''}`.slice(-1500)
            });
            break;
        }
    }
    return results;
}

function runAuditChecks(checks) {
    const rows = [];
    for (const key of checks || []) {
        rows.push({
            key,
            present: Boolean(process.env[key]),
        });
    }
    return rows;
}

class CapabilityEngine {
    constructor(supabase) {
        this.supabase = supabase;
        this.registry = loadRegistry();
    }

    list() {
        return this.registry.capabilities.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            target_default: c.target_default,
            summary: c.summary
        }));
    }

    show(id) {
        return getCapabilityOrThrow(this.registry, id);
    }

    async run(id, target) {
        const cap = this.show(id);

        if (cap.type === 'delegate') {
            const { prdPath } = writePlanFiles(cap, target);
            return {
                mode: 'delegate',
                capability: cap.id,
                delegate_command: `sage:delegate ${prdPath}`,
                prd_path: prdPath
            };
        }

        if (cap.type === 'gate') {
            return {
                mode: 'gate',
                capability: cap.id,
                results: runGateCommands(cap.commands)
            };
        }

        if (cap.type === 'audit') {
            return {
                mode: 'audit',
                capability: cap.id,
                checks: runAuditChecks(cap.checks)
            };
        }

        return {
            mode: 'noop',
            capability: cap.id,
            message: 'Capability exists but has no executable handler.'
        };
    }
}

async function cli() {
    const engine = new CapabilityEngine();
    const action = (process.argv[2] || 'list').toLowerCase();
    const arg1 = process.argv[3];
    const arg2 = process.argv[4];

    if (action === 'list') {
        console.log(JSON.stringify(engine.list(), null, 2));
        return;
    }

    if (action === 'show') {
        if (!arg1) throw new Error('Usage: node capability-engine.cjs show <capability_id>');
        console.log(JSON.stringify(engine.show(arg1), null, 2));
        return;
    }

    if (action === 'run') {
        if (!arg1) throw new Error('Usage: node capability-engine.cjs run <capability_id> [target]');
        const result = await engine.run(arg1, arg2);
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    throw new Error('Unknown action. Use: list | show | run');
}

if (require.main === module) {
    cli().catch(err => {
        console.error('[CAPABILITY_ENGINE_ERROR]', err.message);
        process.exit(1);
    });
}

module.exports = CapabilityEngine;
