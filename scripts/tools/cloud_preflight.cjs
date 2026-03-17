#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const { Octokit } = require('@octokit/rest');
const { resolveRuntimeProfile } = require('./runtime_profile.cjs');

function parseArgs(argv) {
    return {
        recover: argv.includes('--recover'),
        dispatch: argv.includes('--dispatch'),
        skipGithub: argv.includes('--skip-github'),
        json: argv.includes('--json'),
        workflow: (() => {
            const idx = argv.indexOf('--workflow');
            return idx >= 0 && argv[idx + 1] ? String(argv[idx + 1]) : 'matrix-shadow.yml';
        })(),
        ref: (() => {
            const idx = argv.indexOf('--ref');
            return idx >= 0 && argv[idx + 1] ? String(argv[idx + 1]) : 'main';
        })()
    };
}

function loadDotEnv(rootDir) {
    const envPath = path.join(rootDir, '.env');
    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim();
        if (key && process.env[key] == null) {
            process.env[key] = value;
        }
    }
}

function parseRepo(input) {
    if (!input) return null;
    if (input.includes('/')) {
        const parts = input.replace(/^https?:\/\/github.com\//i, '').replace(/\.git$/i, '').split('/');
        if (parts.length >= 2) {
            return { owner: parts[0], repo: parts[1] };
        }
    }
    return null;
}

function getRepoFromPackage(rootDir) {
    try {
        const pkgPath = path.join(rootDir, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg?.repository?.url) {
            return parseRepo(pkg.repository.url);
        }
    } catch { }
    return null;
}

function ageSeconds(dateString) {
    if (!dateString) return null;
    const ms = Date.parse(dateString);
    if (Number.isNaN(ms)) return null;
    return Math.round((Date.now() - ms) / 1000);
}

function status(ok) {
    return ok ? 'OK' : 'FAIL';
}

function describeErr(err) {
    const message = err?.message || String(err);
    const causeCode = err?.cause?.code || err?.code;
    if (causeCode) return `${message} [code=${causeCode}]`;
    return message;
}

function firstEnv(...keys) {
    for (const key of keys) {
        const value = String(process.env[key] || '').trim();
        if (value) return value;
    }
    return '';
}

function isTruthy(input) {
    const normalized = String(input || '').trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function isPlaceholder(value) {
    const v = String(value || '').trim().toLowerCase();
    if (!v) return true;
    return (
        v === 'xxx' ||
        v === 'placeholder' ||
        v === 'your-key' ||
        v === 'your-token' ||
        v === 'your-project-url' ||
        v === 'your-project.supabase.co' ||
        v === 'changeme' ||
        v.includes('your-project') ||
        v.includes('replace_me')
    );
}

function checkCredential(checks, name, value, required, detailMissing, detailPresent) {
    const present = String(value || '').trim().length > 0 && !isPlaceholder(value);
    if (!required && !present) {
        checks.push({ name, ok: true, detail: `${detailMissing} (optional)` });
        return;
    }
    checks.push({
        name,
        ok: present,
        detail: present ? detailPresent : detailMissing
    });
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const rootDir = path.resolve(__dirname, '..', '..');
    loadDotEnv(rootDir);

    const supabaseUrl = firstEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = firstEnv(
        'SUPABASE_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_SECRET_KEY',
        'SUPABASE_ANON_KEY',
        'SUPABASE_PUBLISHABLE_KEY',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
    const githubToken = firstEnv('GITHUB_TOKEN', 'GH_TOKEN');
    const repo = parseRepo(process.env.GITHUB_REPO) || getRepoFromPackage(rootDir) || { owner: 'bernardr27', repo: 'matrixsystem' };
    const runtimeProfile = resolveRuntimeProfile(process.env);
    const matrixProduction = runtimeProfile.production;
    const aiBaseUrl = firstEnv('AI_BASE_URL', 'OPENAI_BASE_URL', 'NEXT_PUBLIC_AI_BASE_URL');
    const aiProviderNeedsKey = aiBaseUrl && !/^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(aiBaseUrl);
    const openAiKey = firstEnv('OPENAI_API_KEY');
    const groqKey = firstEnv('GROQ_API_KEY');
    const anthropicKey = firstEnv('ANTHROPIC_API_KEY');
    const redisUrl = firstEnv('REDIS_URL');
    const sentryDsn = firstEnv('SENTRY_DSN_NODE', 'SENTRY_DSN_NEXTJS', 'SENTRY_DSN');
    const cloudflareToken = firstEnv('CLOUDFLARE_API_TOKEN', 'CF_API_TOKEN');
    const cloudflareAccount = firstEnv('CLOUDFLARE_ACCOUNT_ID');

    const checks = [];
    let supabase = null;

    if (!args.json) {
        console.log('=== MATRIX CLOUD PREFLIGHT ===');
        console.log(`time: ${new Date().toISOString()}`);
        console.log(`repo: ${repo.owner}/${repo.repo}`);
        console.log(`workflow: ${args.workflow} (ref=${args.ref})`);
        console.log(`mode: ${args.recover ? 'recover' : 'diagnose'}${args.dispatch ? ' + dispatch' : ''}`);
        console.log(`profile: ${runtimeProfile.name}`);
        console.log('');
    }

    checkCredential(
        checks,
        'supabase_url',
        supabaseUrl,
        true,
        'Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)',
        'Supabase URL loaded'
    );
    checkCredential(
        checks,
        'supabase_key',
        supabaseKey,
        true,
        'Missing Supabase key (SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY/SUPABASE_ANON_KEY/SUPABASE_PUBLISHABLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY)',
        'Supabase key loaded'
    );

    checkCredential(
        checks,
        'github_token',
        githubToken,
        !args.skipGithub,
        'Missing GITHUB_TOKEN (or GH_TOKEN)',
        'GitHub token loaded'
    );
    checkCredential(
        checks,
        'redis_url',
        redisUrl,
        matrixProduction,
        'Missing REDIS_URL',
        'Redis URL loaded'
    );
    checkCredential(
        checks,
        'sentry_dsn',
        sentryDsn,
        false,
        'SENTRY_DSN not configured',
        'Sentry DSN loaded'
    );
    checkCredential(
        checks,
        'ai_provider_key',
        openAiKey || groqKey || anthropicKey,
        Boolean(aiProviderNeedsKey),
        'AI_BASE_URL points to remote provider but OPENAI_API_KEY/GROQ_API_KEY/ANTHROPIC_API_KEY is missing',
        'AI provider key loaded'
    );
    checkCredential(
        checks,
        'cloudflare_credentials',
        cloudflareToken && cloudflareAccount ? 'ok' : '',
        false,
        'Cloudflare API credentials not configured',
        'Cloudflare API credentials loaded'
    );

    if (supabaseUrl && supabaseKey && !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseKey)) {
        checks.push({ name: 'supabase_env', ok: true, detail: 'Supabase environment loaded' });
        supabase = createClient(supabaseUrl, supabaseKey);
    } else {
        checks.push({ name: 'supabase_env', ok: false, detail: 'Supabase env is missing or contains placeholder values' });
    }

    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('matrix_instances')
                .select('instance_name,status,last_heartbeat')
                .eq('environment', 'production')
                .order('last_heartbeat', { ascending: false })
                .limit(1);

            if (error) throw error;
            const row = Array.isArray(data) && data.length ? data[0] : null;
            const age = ageSeconds(row?.last_heartbeat);
            checks.push({
                name: 'matrix_instances_read',
                ok: true,
                detail: row
                    ? `instance=${row.instance_name || 'unknown'}, status=${row.status || 'unknown'}, heartbeat_age=${age ?? 'n/a'}s`
                    : 'No production row found in matrix_instances'
            });
        } catch (err) {
            checks.push({ name: 'matrix_instances_read', ok: false, detail: describeErr(err) });
        }

        try {
            const { data: hbData, error: hbErr } = await supabase
                .from('system_heartbeats')
                .select('source,created_at')
                .in('source', ['nexus_sentinel', 'ghost_runner'])
                .order('created_at', { ascending: false })
                .limit(20);
            if (hbErr) throw hbErr;

            const rows = Array.isArray(hbData) ? hbData : [];
            const sentinel = rows.find((r) => r.source === 'nexus_sentinel');
            const runner = rows.find((r) => r.source === 'ghost_runner');
            const sentinelAge = ageSeconds(sentinel?.created_at);
            const runnerAge = ageSeconds(runner?.created_at);
            if (sentinelAge == null || runnerAge == null) {
                throw new Error('EMPTY_SYSTEM_HEARTBEATS');
            }
            const hbOk = sentinelAge <= 300 && runnerAge <= 300;
            checks.push({
                name: 'heartbeat_freshness',
                ok: hbOk,
                detail: `sentinel_age=${sentinelAge}s, runner_age=${runnerAge}s`
            });
        } catch (err) {
            try {
                const { data, error } = await supabase
                    .from('ghost_bridge')
                    .select('id,source,created_at,output')
                    .eq('command', 'sys:heartbeat')
                    .order('created_at', { ascending: false })
                    .limit(1);
                if (error) throw error;
                const hb = Array.isArray(data) && data.length ? data[0] : null;
                const hbAge = ageSeconds(hb?.created_at);
                const hbOk = hb && hbAge != null ? hbAge <= 300 : false;
                checks.push({
                    name: 'heartbeat_freshness',
                    ok: hbOk,
                    detail: hb
                        ? `legacy source=${hb.source || 'unknown'}, age=${hbAge}s`
                        : 'No heartbeat rows found in legacy table'
                });
            } catch (legacyErr) {
                checks.push({ name: 'heartbeat_freshness', ok: false, detail: describeErr(legacyErr) });
            }
        }

        try {
            const { count, error } = await supabase
                .from('ghost_bridge')
                .select('id', { head: true, count: 'exact' })
                .eq('status', 'pending');
            if (error) throw error;
            checks.push({
                name: 'pending_queue',
                ok: true,
                detail: `pending_commands=${count ?? 0}`
            });
        } catch (err) {
            checks.push({ name: 'pending_queue', ok: false, detail: describeErr(err) });
        }

        try {
            const marker = `preflight_${Date.now()}`;
            const { data: ins, error: insErr } = await supabase
                .from('ghost_bridge')
                .insert({
                    command: 'sys:probe',
                    status: 'silent',
                    source: 'cli_cloud_preflight',
                    output: marker
                })
                .select('id')
                .single();
            if (insErr) throw insErr;
            const rowId = ins?.id;
            if (rowId) {
                await supabase.from('ghost_bridge').delete().eq('id', rowId);
            }
            checks.push({ name: 'ghost_bridge_write', ok: true, detail: 'Insert/delete probe successful' });
        } catch (err) {
            checks.push({ name: 'ghost_bridge_write', ok: false, detail: describeErr(err) });
        }
    }

    if (args.skipGithub) {
        checks.push({ name: 'github_skipped', ok: true, detail: 'GitHub checks skipped by flag' });
    } else if (githubToken && !isPlaceholder(githubToken)) {
        const octokit = new Octokit({ auth: githubToken, userAgent: 'matrix-cloud-preflight/1.0' });

        try {
            const { data } = await octokit.repos.get({ owner: repo.owner, repo: repo.repo });
            checks.push({ name: 'github_repo_access', ok: true, detail: `repo=${data.full_name}, private=${Boolean(data.private)}` });
        } catch (err) {
            checks.push({ name: 'github_repo_access', ok: false, detail: describeErr(err) });
        }

        try {
            const { data } = await octokit.actions.getWorkflow({
                owner: repo.owner,
                repo: repo.repo,
                workflow_id: args.workflow
            });
            checks.push({ name: 'github_workflow_access', ok: true, detail: `workflow=${data.name || args.workflow}, state=${data.state || 'unknown'}` });
        } catch (err) {
            checks.push({ name: 'github_workflow_access', ok: false, detail: describeErr(err) });
        }

        if (args.dispatch) {
            try {
                await octokit.actions.createWorkflowDispatch({
                    owner: repo.owner,
                    repo: repo.repo,
                    workflow_id: args.workflow,
                    ref: args.ref,
                    inputs: { action: 'deploy' }
                });
                checks.push({ name: 'github_dispatch', ok: true, detail: `Workflow dispatch sent to ${args.workflow}@${args.ref}` });
            } catch (err) {
                checks.push({ name: 'github_dispatch', ok: false, detail: describeErr(err) });
            }
        }
    }

    if (args.recover && supabase) {
        try {
            const cloudOnly = String(process.env.MATRIX_CLOUD_MODE || '').toLowerCase() === 'true';
            const commands = cloudOnly
                ? ['sys:cloud_ignite']
                : ['sys:start_sentinel', 'sys:start_runner', 'sys:ignite'];
            for (const command of commands) {
                const { error } = await supabase.from('ghost_bridge').insert({
                    command,
                    status: 'pending',
                    source: 'cli_cloud_preflight'
                });
                if (error) throw error;
            }
            checks.push({ name: 'recover_queue', ok: true, detail: `Queued ${commands.join(', ')}` });
        } catch (err) {
            checks.push({ name: 'recover_queue', ok: false, detail: describeErr(err) });
        }
    }

    const isIgnorableFailure = (check) => {
        const cloudOnly = String(process.env.MATRIX_CLOUD_MODE || '').toLowerCase() === 'true';
        if (check.ok) return false;
        if (args.skipGithub && check.name.startsWith('github_')) return true;
        if (args.recover && check.name === 'redis_url') return true;
        if (cloudOnly && check.name === 'heartbeat_freshness') return true;
        return false;
    };

    if (!args.json) {
        console.log('--- RESULTS ---');
        for (const c of checks) {
            console.log(`[${status(c.ok)}] ${c.name}: ${c.detail}`);
        }
        console.log('');
    }

    const failed = checks.filter(c => !c.ok);
    const blocking = failed.filter(c => !isIgnorableFailure(c));
    const result = {
        ok: blocking.length === 0,
        mode: args.recover ? 'recover' : 'diagnose',
        skipGithub: args.skipGithub,
        failed: failed.map(f => ({ name: f.name, detail: f.detail })),
        blocking: blocking.map(f => ({ name: f.name, detail: f.detail })),
        checks
    };

    if (!blocking.length) {
        if (args.json) {
            process.stdout.write(`${JSON.stringify(result)}\n`);
        } else {
            if (failed.length) {
                console.log(`Cloud preflight passed with warnings (${failed.length} non-blocking checks).`);
            } else {
                console.log('Cloud preflight passed.');
            }
        }
        process.exit(0);
    }

    if (args.json) {
        process.stdout.write(`${JSON.stringify(result)}\n`);
    } else {
        console.log(`Cloud preflight failed (${blocking.length} blocking checks, ${failed.length} total failed).`);
    }
    process.exit(2);
}

main().catch((err) => {
    console.error('[FATAL]', err?.message || String(err));
    process.exit(1);
});
