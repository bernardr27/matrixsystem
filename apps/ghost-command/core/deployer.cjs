/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         MATRIX DEPLOYER                                   ║
 * ║                    One-Click Deployment Pipeline                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  FEATURES:                                                                ║
 * ║    • Build verification before deploy                                    ║
 * ║    • Vercel / Netlify / Custom deployment                                ║
 * ║    • Rollback capability                                                  ║
 * ║    • Deployment history tracking                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const { ANALYTICS } = require('./analytics.cjs');

// Configuration
const MATRIX_ROOT = path.resolve(__dirname, '..');
const APPS_DIR = path.join(MATRIX_ROOT, 'apps');
const DEPLOY_DIR = path.join(MATRIX_ROOT, '.deploys');
const HISTORY_FILE = path.join(DEPLOY_DIR, 'history.json');
const CONFIG_FILE = path.join(MATRIX_ROOT, 'deploy.config.json');

// Ensure deploy directory exists
if (!fs.existsSync(DEPLOY_DIR)) {
    fs.mkdirSync(DEPLOY_DIR, { recursive: true });
}

// Supabase (optional)
let supabase = null;
try {
    require('dotenv').config({ path: path.join(MATRIX_ROOT, '.env') });
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    }
} catch (e) { }

// Logging
const log = (msg, type = 'info') => {
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m'
    };
    console.log(`${colors[type]}[DEPLOYER]${'\x1b[0m'} ${msg}`);
};

// Load/Save history
const loadHistory = () => {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    } catch (e) {
        log('Error parsing deployment history, resetting: ' + e.message, 'warn');
        return [];
    }
};

const saveHistory = (history) => {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
};

// Load Config
const loadConfig = () => {
    if (!fs.existsSync(CONFIG_FILE)) return { apps: {}, defaults: {} };
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch (e) {
        log('Error loading deploy.config.json: ' + e.message, 'error');
        return { apps: {}, defaults: {} };
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// DEPLOYER MODULE
// ═══════════════════════════════════════════════════════════════════════════

const DEPLOYER = {
    listApps() {
        if (!fs.existsSync(APPS_DIR)) return [];
        return fs.readdirSync(APPS_DIR).filter(d =>
            fs.statSync(path.join(APPS_DIR, d)).isDirectory() &&
            fs.existsSync(path.join(APPS_DIR, d, 'package.json'))
        );
    },

    async verify(appName) {
        log(`Verifying ${appName}...`);
        const appPath = path.join(APPS_DIR, appName);

        if (!fs.existsSync(appPath)) {
            throw new Error(`App not found: ${appName}`);
        }

        const results = {
            app: appName,
            timestamp: new Date().toISOString(),
            checks: {}
        };

        // Check package.json
        const pkgPath = path.join(appPath, 'package.json');
        if (!fs.existsSync(pkgPath)) {
            throw new Error('No package.json found');
        }
        let pkg = {};
        try {
            pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        } catch (e) {
            throw new Error(`Failed to parse package.json: ${e.message}`);
        }
        results.checks.hasPackageJson = true;
        results.checks.hasBuildScript = !!pkg.scripts?.build;

        // Run build
        log('Running build...');
        try {
            execSync('npm run build', {
                cwd: appPath,
                stdio: 'pipe',
                timeout: 300000 // 5 min timeout
            });
            results.checks.buildSuccess = true;
            log('Build successful!', 'success');
        } catch (e) {
            results.checks.buildSuccess = false;
            results.checks.buildError = e.stderr?.toString() || e.message;
            log('Build failed!', 'error');
            return results;
        }

        // Check TypeScript errors
        log('Checking TypeScript...');
        try {
            execSync('npx tsc --noEmit', { cwd: appPath, stdio: 'pipe', windowsHide: true });
            results.checks.typescriptClean = true;
        } catch (e) {
            results.checks.typescriptClean = false;
            results.checks.typeErrors = e.stdout?.toString().split('\n').length || 0;
        }

        results.verified = results.checks.buildSuccess;
        return results;
    },

    async deploy(appName, target = 'vercel', options = {}) {
        const config = loadConfig();
        const appConfig = config.apps[appName] || {};

        // Merge options: CLI defaults -> Config -> CLI overrides
        const finalTarget = target || appConfig.target || 'vercel';
        const isProd = options.prod !== undefined ? options.prod : (appConfig.prod || false);
        const shouldVerify = options.skipVerify !== undefined ? !options.skipVerify : (config.defaults.skipVerify !== true);

        log(`Deploying ${appName} to ${finalTarget} ${isProd ? '(PROD)' : '(PREVIEW)'}...`);

        // Verify first
        if (shouldVerify) {
            const verification = await this.verify(appName);
            if (!verification.verified) {
                log('Deployment blocked: verification failed', 'error');
                return { success: false, reason: 'verification_failed', verification };
            }
        }

        const appPath = path.join(APPS_DIR, appName);
        const deployId = Date.now();
        const result = {
            id: deployId,
            app: appName,
            target: finalTarget,
            timestamp: new Date().toISOString(),
            success: false
        };

        try {
            if (finalTarget === 'vercel') {
                // Check if vercel CLI is available
                try {
                    execSync('vercel --version', { stdio: 'pipe' });
                } catch {
                    throw new Error('Vercel CLI not installed. Run: npm i -g vercel');
                }

                // Deploy
                const cmd = isProd ? 'vercel --prod' : 'vercel';
                log(`Running: ${cmd} `);
                const output = execSync(cmd, {
                    cwd: appPath,
                    encoding: 'utf-8',
                    stdio: 'pipe'
                });

                // Extract URL from output
                const urlMatch = output.match(/https:\/\/[^\s]+vercel\.app/);
                result.url = urlMatch ? urlMatch[0] : null;
                result.success = true;
                log(`Deployed to: ${result.url} `, 'success');
            }
            else if (finalTarget === 'netlify') {
                try {
                    execSync('netlify --version', { stdio: 'pipe' });
                } catch {
                    throw new Error('Netlify CLI not installed. Run: npm i -g netlify-cli');
                }

                const cmd = options.prod ? 'netlify deploy --prod' : 'netlify deploy';
                log(`Running: ${cmd} `);
                const output = execSync(cmd, {
                    cwd: appPath,
                    encoding: 'utf-8',
                    stdio: 'pipe'
                });

                const urlMatch = output.match(/https:\/\/[^\s]+netlify\.app/);
                result.url = urlMatch ? urlMatch[0] : null;
                result.success = true;
                log(`Deployed to: ${result.url} `, 'success');
            }
            else if (finalTarget === 'local') {
                // Just build and output location
                const buildDir = path.join(appPath, '.next') || path.join(appPath, 'dist');
                result.url = buildDir;
                result.success = true;
                log(`Build ready at: ${buildDir} `, 'success');
            }
            else {
                throw new Error(`Unknown target: ${finalTarget}.Use: vercel, netlify, local`);
            }

            // Save to history
            const history = loadHistory();
            history.push(result);
            saveHistory(history);

            // Track analytics
            ANALYTICS.trackDeploy(appName, finalTarget, true, result.url);

            // Post to ghost_bridge
            if (supabase) {
                await supabase.from('ghost_bridge').insert({
                    command: 'deploy:complete',
                    payload: JSON.stringify(result),
                    status: 'complete',
                    source: 'matrix_deployer'
                });
            }

        } catch (e) {
            result.success = false;
            result.error = e.message;
            log(`Deployment failed: ${e.message} `, 'error');
            ANALYTICS.trackDeploy(appName, finalTarget, false);
        }

        return result;
    },

    async rollback(appName, deployId = null) {
        log(`Rolling back ${appName}...`);
        const history = loadHistory().filter(h => h.app === appName && h.success);

        if (history.length < 2) {
            log('No previous deployment to rollback to', 'error');
            return { success: false, reason: 'no_history' };
        }

        const target = deployId
            ? history.find(h => h.id === parseInt(deployId))
            : history[history.length - 2]; // Second to last

        if (!target) {
            log('Target deployment not found', 'error');
            return { success: false, reason: 'not_found' };
        }

        log(`Rollback target: ${target.id} (${target.timestamp})`, 'info');
        // Note: Actual rollback depends on platform - Vercel/Netlify have their own rollback
        log('Use platform dashboard for actual rollback, or redeploy from git', 'warn');

        return { success: true, target };
    },

    async history(appName = null) {
        const history = loadHistory();
        const filtered = appName ? history.filter(h => h.app === appName) : history;

        console.log(`\n📦 Deployment History${appName ? ` for ${appName}` : ''}: \n`);
        if (filtered.length === 0) {
            console.log('  No deployments recorded.\n');
        } else {
            filtered.slice(-10).reverse().forEach(h => {
                const status = h.success ? '✅' : '❌';
                console.log(`  ${status} [${h.timestamp}] ${h.app} → ${h.target} ${h.url || ''} `);
            });
            console.log('');
        }
        return { history: filtered };
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

const printHelp = () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                         MATRIX DEPLOYER                                   ║
║                    One - Click Deployment Pipeline                          ║
╚═══════════════════════════════════════════════════════════════════════════╝

USAGE:
  node deployer.cjs < command > <app> [options]

    COMMANDS:
    verify <app>          Run pre-deploy verification (build + typecheck)
        deploy <app> [target] Deploy app (target: vercel, netlify, local)
            rollback <app>        Rollback to previous deployment
                history [app]         Show deployment history

                OPTIONS:
                --prod                Deploy to production
                --skip-verify         Skip verification step
                --id=<deployId>       Specific deployment ID for rollback

                    EXAMPLES:
                    node deployer.cjs verify reflect
                    node deployer.cjs deploy matrix-hub vercel --prod
                    node deployer.cjs rollback reflect
                    node deployer.cjs history

                    AVAILABLE APPS:
                    ${DEPLOYER.listApps().join(', ') || 'No apps found'}
                    `);
};

(async () => {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        printHelp();
        process.exit(0);
    }

    const command = args[0];
    const normalizeAppName = (app) => {
        if (!app) return app;
        const normalized = app.toLowerCase();
        if (['matrix', 'matrix-hub', 'matrixhub'].includes(normalized)) return 'nexus';
        return normalized;
    };
    const appName = normalizeAppName(args[1]);
    const target = args[2] || 'vercel';

    const options = {
        prod: args.includes('--prod'),
        skipVerify: args.includes('--skip-verify'),
        id: args.find(a => a.startsWith('--id='))?.split('=')[1]
    };

    try {
        if (command === 'verify') {
            if (!appName) throw new Error('App name required');
            const result = await DEPLOYER.verify(appName);
            console.log(JSON.stringify(result, null, 2));
        }
        else if (command === 'deploy') {
            if (!appName) throw new Error('App name required');
            const result = await DEPLOYER.deploy(appName, target, options);
            if (!result.success) process.exit(1);
        }
        else if (command === 'rollback') {
            if (!appName) throw new Error('App name required');
            await DEPLOYER.rollback(appName, options.id);
        }
        else if (command === 'history') {
            await DEPLOYER.history(appName);
        }
        else {
            console.error(`Unknown command: ${command}`);
            printHelp();
            process.exit(1);
        }
    } catch (e) {
        log(e.message, 'error');
        process.exit(1);
    }
})();

module.exports = { DEPLOYER };
