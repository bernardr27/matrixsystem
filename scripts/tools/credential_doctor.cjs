#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function loadDotEnv() {
    const envPath = path.join(ROOT, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i <= 0) continue;
        const k = t.slice(0, i).trim();
        const v = t.slice(i + 1).trim();
        if (k && process.env[k] == null) process.env[k] = v;
    }
}

function has(v) {
    return String(v || '').trim().length > 0;
}

function placeholder(v) {
    const x = String(v || '').toLowerCase();
    return !x || x.includes('your-') || x.includes('placeholder') || x === 'xxx' || x === 'changeme';
}

function check(name, value, required = true) {
    const present = has(value) && !placeholder(value);
    return {
        name,
        ok: required ? present : true,
        present,
        required,
        detail: present ? 'set' : (required ? 'missing_or_placeholder' : 'optional_missing')
    };
}

function main() {
    loadDotEnv();
    const checks = [
        check('SUPABASE_URL', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, true),
        check('SUPABASE_KEY_OR_EQUIV', process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, true),
        check('GITHUB_TOKEN', process.env.GITHUB_TOKEN || process.env.GH_TOKEN, true),
        check('REDIS_URL', process.env.REDIS_URL, String(process.env.MATRIX_MODE || '').toLowerCase() === 'production'),
        check('OPENAI/GROQ/ANTHROPIC_KEY', process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY, false),
        check('SENTRY_DSN', process.env.SENTRY_DSN || process.env.SENTRY_DSN_NODE || process.env.SENTRY_DSN_NEXTJS, false),
        check('CLOUDFLARE_API_TOKEN', process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN, false)
    ];

    const failed = checks.filter((c) => !c.ok);
    const out = { ok: failed.length === 0, checks, failed: failed.map((f) => f.name) };
    if (process.argv.includes('--json')) {
        process.stdout.write(`${JSON.stringify(out)}\n`);
        process.exit(out.ok ? 0 : 1);
    }

    console.log('=== CREDENTIAL DOCTOR ===');
    for (const c of checks) {
        const label = c.ok ? 'OK' : 'FAIL';
        console.log(`[${label}] ${c.name}: ${c.detail}`);
    }
    if (!out.ok) console.log(`Credential doctor failed: ${out.failed.join(', ')}`);
    process.exit(out.ok ? 0 : 1);
}

main();
