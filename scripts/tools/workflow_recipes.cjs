#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const RECIPES_PATH = path.join(ROOT, 'config', 'runtime', 'workflow_recipes.json');

function npmCmd() {
    return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function parseArgs(argv) {
    const command = (argv[0] || 'list').toLowerCase();
    const id = argv[1] && !argv[1].startsWith('--') ? argv[1] : null;
    return {
        command,
        id,
        json: argv.includes('--json'),
        dryRun: argv.includes('--dry-run')
    };
}

function loadRecipes() {
    if (!fs.existsSync(RECIPES_PATH)) {
        throw new Error(`Missing recipe registry: ${RECIPES_PATH}`);
    }
    const data = JSON.parse(fs.readFileSync(RECIPES_PATH, 'utf8'));
    const recipes = Array.isArray(data.recipes) ? data.recipes : [];
    return { version: data.version || 1, recipes };
}

function findRecipe(registry, id) {
    return registry.recipes.find((r) => r.id === id) || null;
}

function runStep(step) {
    return new Promise((resolve) => {
        const startedAt = Date.now();
        let cmd = '';
        let args = [];
        if (step.type === 'npm') {
            cmd = npmCmd();
            args = ['run', String(step.script)];
        } else if (step.type === 'shell') {
            if (process.platform === 'win32') {
                cmd = 'cmd.exe';
                args = ['/d', '/s', '/c', String(step.command)];
            } else {
                cmd = 'bash';
                args = ['-lc', String(step.command)];
            }
        } else {
            resolve({
                ok: false,
                stepId: step.id,
                error: `Unsupported step type: ${String(step.type || '')}`,
                durationMs: Date.now() - startedAt
            });
            return;
        }

        const child = spawn(cmd, args, {
            cwd: ROOT,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (buf) => { stdout += String(buf || ''); });
        child.stderr.on('data', (buf) => { stderr += String(buf || ''); });
        child.on('error', (err) => {
            resolve({
                ok: false,
                stepId: step.id,
                code: -1,
                error: err?.message || String(err),
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                durationMs: Date.now() - startedAt
            });
        });
        child.on('close', (code) => {
            resolve({
                ok: code === 0,
                stepId: step.id,
                code,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                durationMs: Date.now() - startedAt
            });
        });
    });
}

async function runRecipe(recipe, dryRun) {
    const startedAt = new Date().toISOString();
    const steps = [];
    let ok = true;

    for (const step of recipe.steps || []) {
        if (dryRun) {
            steps.push({
                stepId: step.id,
                ok: true,
                skipped: true,
                dryRun: true,
                plan: step
            });
            continue;
        }

        const result = await runStep(step);
        steps.push(result);
        if (!result.ok && step.critical !== false) {
            ok = false;
            break;
        }
        if (!result.ok) ok = false;
    }

    return {
        ok,
        recipeId: recipe.id,
        startedAt,
        finishedAt: new Date().toISOString(),
        steps
    };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const registry = loadRecipes();

    if (args.command === 'list') {
        const payload = {
            ok: true,
            version: registry.version,
            recipes: registry.recipes.map((r) => ({
                id: r.id,
                summary: r.summary,
                steps: Array.isArray(r.steps) ? r.steps.length : 0
            }))
        };
        if (args.json) return void process.stdout.write(`${JSON.stringify(payload)}\n`);
        console.log('Workflow Recipes');
        for (const recipe of payload.recipes) {
            console.log(`- ${recipe.id}: ${recipe.summary} (steps=${recipe.steps})`);
        }
        return;
    }

    if (args.command === 'show') {
        if (!args.id) throw new Error('Usage: workflow_recipes.cjs show <recipeId>');
        const recipe = findRecipe(registry, args.id);
        if (!recipe) throw new Error(`Unknown recipe: ${args.id}`);
        const payload = { ok: true, recipe };
        if (args.json) return void process.stdout.write(`${JSON.stringify(payload)}\n`);
        console.log(JSON.stringify(payload, null, 2));
        return;
    }

    if (args.command === 'run') {
        if (!args.id) throw new Error('Usage: workflow_recipes.cjs run <recipeId> [--dry-run]');
        const recipe = findRecipe(registry, args.id);
        if (!recipe) throw new Error(`Unknown recipe: ${args.id}`);
        const result = await runRecipe(recipe, args.dryRun);
        if (args.json) {
            process.stdout.write(`${JSON.stringify(result)}\n`);
        } else {
            console.log(`[workflow_recipes] recipe=${recipe.id} ok=${result.ok}`);
            for (const step of result.steps) {
                console.log(` - ${step.stepId}: ${step.ok ? 'OK' : 'FAIL'}${step.skipped ? ' (dry-run)' : ''}`);
            }
        }
        process.exit(result.ok ? 0 : 1);
        return;
    }

    throw new Error(`Unsupported command: ${args.command}`);
}

main().catch((err) => {
    console.error(`[workflow_recipes] ${err?.message || String(err)}`);
    process.exit(1);
});

