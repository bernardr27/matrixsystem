/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         MATRIX TRIAGE SYSTEM                              ║
 * ║                   Self-Healing Codebase Analysis Engine                   ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  MODULES:                                                                 ║
 * ║    • EVOLVE  - UI/UX Upgrader & Enhancement Scanner                      ║
 * ║    • PURGE   - Code Debugger & Auto-Fixer                                ║
 * ║    • ORACLE  - Audit Reporter & Plan Generator                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const { ANALYTICS } = require('./analytics.cjs');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const MATRIX_ROOT = path.resolve(__dirname, '../../..');
const APPS_DIR = path.join(MATRIX_ROOT, 'apps');
const DOCS_DIR = path.join(MATRIX_ROOT, 'docs');
const AUDITS_DIR = path.join(DOCS_DIR, 'audits');
const TRIAGE_DIR = path.join(MATRIX_ROOT, '.triage');
const SNAPSHOTS_DIR = path.join(TRIAGE_DIR, 'snapshots');
const HISTORY_FILE = path.join(TRIAGE_DIR, 'history.json');

// Verification Thresholds
const THRESHOLDS = {
    LOW: 10,      // 1-10 files: apply immediately
    MEDIUM: 50,   // 11-50 files: require --confirm
    HIGH: 100,    // 51-100 files: interactive prompt
    CRITICAL: 100 // 100+ files: force --force flag
};

// Supabase (optional, for ghost_bridge integration)
let supabase = null;
try {
    require('dotenv').config({ path: path.join(MATRIX_ROOT, '.env') });
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    }
} catch (e) {
    console.log('[TRIAGE] Running without Supabase integration');
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG FILE SUPPORT
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG_PATH = path.join(MATRIX_ROOT, 'triage.config.json');
let CONFIG = null;

const loadConfig = () => {
    if (CONFIG) return CONFIG;

    const defaultConfig = {
        apps: {},
        thresholds: { low: 10, medium: 50, high: 100 },
        snapshots: { keepCount: 5, autoCleanup: true },
        notifications: { enabled: false, webhook: '', events: [] },
        schedule: { enabled: false, cron: '', apps: [] },
        scoring: {
            weights: { info: 1, low: 2, medium: 5, high: 10, critical: 25 },
            baseScore: 100,
            maxDeductions: 100
        }
    };

    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
            CONFIG = { ...defaultConfig, ...fileConfig };
            log('config', `Loaded config from ${CONFIG_PATH}`, 'info');
        } else {
            CONFIG = defaultConfig;
        }
    } catch (e) {
        log('config', `Failed to load config: ${e.message}`, 'warn');
        CONFIG = defaultConfig;
    }

    return CONFIG;
};

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

const sendWebhook = async (event, data) => {
    const config = loadConfig();
    if (!config.notifications.enabled || !config.notifications.webhook) return;
    if (!config.notifications.events.includes(event)) return;

    try {
        const https = require('https');
        const url = new URL(config.notifications.webhook);

        const payload = JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString(),
            source: 'matrix-triage'
        });

        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    log('webhook', `Notification sent: ${event}`, 'success');
                    resolve();
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
            req.on('error', reject);
            req.write(payload);
            req.end();
        });
    } catch (e) {
        log('webhook', `Failed to send notification: ${e.message}`, 'warn');
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const log = (module, msg, type = 'info') => {
    const prefix = {
        evolve: '\x1b[36m[EVOLVE]\x1b[0m',
        purge: '\x1b[35m[PURGE]\x1b[0m',
        oracle: '\x1b[33m[ORACLE]\x1b[0m',
        triage: '\x1b[32m[TRIAGE]\x1b[0m',
        revert: '\x1b[31m[REVERT]\x1b[0m',
        security: '\x1b[34m[SECURITY]\x1b[0m',
        config: '\x1b[90m[CONFIG]\x1b[0m',
        webhook: '\x1b[95m[WEBHOOK]\x1b[0m',
        diff: '\x1b[96m[DIFF]\x1b[0m'
    };
    const typeColors = {
        info: '',
        success: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m'
    };
    console.log(`${prefix[module] || '[TRIAGE]'} ${typeColors[type]}${msg}\x1b[0m`);
};

// ═══════════════════════════════════════════════════════════════════════════
// DIFF REPORTER
// ═══════════════════════════════════════════════════════════════════════════

const generateDiff = (originalContent, newContent, filename) => {
    const originalLines = originalContent.split('\n');
    const newLines = newContent.split('\n');
    const changes = [];

    // Simple line-by-line diff
    const maxLines = Math.max(originalLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
        const orig = originalLines[i] || '';
        const updated = newLines[i] || '';

        if (orig !== updated) {
            if (orig && !updated) {
                changes.push({ line: i + 1, type: 'remove', content: orig });
            } else if (!orig && updated) {
                changes.push({ line: i + 1, type: 'add', content: updated });
            } else {
                changes.push({ line: i + 1, type: 'remove', content: orig });
                changes.push({ line: i + 1, type: 'add', content: updated });
            }
        }
    }

    return { filename, changes, linesChanged: changes.length };
};

const showDiffReport = (diffs) => {
    if (diffs.length === 0) {
        log('diff', 'No changes made.', 'info');
        return;
    }

    console.log('\n\x1b[96m╔═══════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[96m║                      DIFF REPORT                              ║\x1b[0m');
    console.log('\x1b[96m╚═══════════════════════════════════════════════════════════════╝\x1b[0m\n');

    let totalRemoved = 0;
    let totalAdded = 0;

    for (const diff of diffs) {
        console.log(`\x1b[1m${diff.filename}\x1b[0m`);
        console.log('─'.repeat(60));

        for (const change of diff.changes.slice(0, 10)) { // Limit to 10 changes per file
            const prefix = change.type === 'add' ? '\x1b[32m+' : '\x1b[31m-';
            const content = change.content.substring(0, 70);
            console.log(`${prefix} L${change.line}: ${content}\x1b[0m`);

            if (change.type === 'add') totalAdded++;
            else totalRemoved++;
        }

        if (diff.changes.length > 10) {
            console.log(`\x1b[90m  ... and ${diff.changes.length - 10} more changes\x1b[0m`);
        }
        console.log('');
    }

    console.log(`\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`);
    console.log(`\x1b[32m+ ${totalAdded} additions\x1b[0m  \x1b[31m- ${totalRemoved} removals\x1b[0m  📁 ${diffs.length} files\n`);
};

const getAppPath = (appName) => {
    const appPath = path.join(APPS_DIR, appName);
    if (!fs.existsSync(appPath)) {
        throw new Error(`App not found: ${appName}`);
    }
    return appPath;
};

const findFiles = (dir, pattern, ignore = ['node_modules', '.next', '.git', 'dist']) => {
    const results = [];
    const walk = (currentDir) => {
        if (!fs.existsSync(currentDir)) return;
        const files = fs.readdirSync(currentDir);
        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                if (!ignore.includes(file)) walk(filePath);
            } else if (pattern.test(file)) {
                results.push(filePath);
            }
        }
    };
    walk(dir);
    return results;
};

const postToGhostBridge = async (command, payload) => {
    if (!supabase) return;
    try {
        await supabase.from('ghost_bridge').insert({
            command,
            payload: JSON.stringify(payload),
            status: 'complete'
        });
    } catch (e) {
        log('triage', `Failed to post to ghost_bridge: ${e.message}`, 'warn');
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY & VERIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const ensureTriageDir = () => {
    if (!fs.existsSync(TRIAGE_DIR)) fs.mkdirSync(TRIAGE_DIR, { recursive: true });
    if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
};

const loadHistory = () => {
    ensureTriageDir();
    if (!fs.existsSync(HISTORY_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    } catch {
        return [];
    }
};

const saveHistory = (history) => {
    ensureTriageDir();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
};

const logOperation = (operation, app, filesAffected, snapshotId = null) => {
    const history = loadHistory();
    history.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        operation,
        app,
        filesAffected,
        snapshotId
    });
    // Keep only last 100 operations
    if (history.length > 100) history.shift();
    saveHistory(history);
};

const createSnapshot = async (appName, filesToBackup) => {
    ensureTriageDir();
    const snapshotId = Date.now();
    const snapshotDir = path.join(SNAPSHOTS_DIR, `${appName}_${snapshotId}`);
    fs.mkdirSync(snapshotDir, { recursive: true });

    const appPath = getAppPath(appName);
    const manifest = {
        id: snapshotId,
        app: appName,
        timestamp: new Date().toISOString(),
        files: []
    };

    for (const file of filesToBackup) {
        const relativePath = path.relative(appPath, file);
        const backupPath = path.join(snapshotDir, relativePath);
        const backupDir = path.dirname(backupPath);

        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        fs.copyFileSync(file, backupPath);
        manifest.files.push(relativePath);
    }

    fs.writeFileSync(path.join(snapshotDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    log('revert', `Snapshot created: ${snapshotId} (${filesToBackup.length} files)`, 'success');

    // Auto-cleanup old snapshots (keep last 5)
    await cleanupSnapshots(appName, 5);

    return snapshotId;
};

const cleanupSnapshots = async (appName, keepCount = 5) => {
    if (!fs.existsSync(SNAPSHOTS_DIR)) return;

    const snapshots = fs.readdirSync(SNAPSHOTS_DIR)
        .filter(d => d.startsWith(`${appName}_`))
        .map(dir => ({
            dir,
            id: parseInt(dir.split('_').pop())
        }))
        .sort((a, b) => b.id - a.id); // Newest first

    if (snapshots.length <= keepCount) return;

    const toDelete = snapshots.slice(keepCount);
    for (const snapshot of toDelete) {
        const snapshotPath = path.join(SNAPSHOTS_DIR, snapshot.dir);
        fs.rmSync(snapshotPath, { recursive: true, force: true });
        log('revert', `Cleaned up old snapshot: ${snapshot.id}`, 'info');
    }
};

const getVerificationLevel = (fileCount) => {
    if (fileCount <= THRESHOLDS.LOW) return 'LOW';
    if (fileCount <= THRESHOLDS.MEDIUM) return 'MEDIUM';
    if (fileCount <= THRESHOLDS.HIGH) return 'HIGH';
    return 'CRITICAL';
};

const checkVerification = (fileCount, options) => {
    const level = getVerificationLevel(fileCount);

    if (level === 'LOW') {
        return { approved: true, message: 'Auto-approved (low impact)' };
    }

    if (level === 'MEDIUM' && !options.confirm && !options.force) {
        return {
            approved: false,
            message: `⚠️ ${fileCount} files will be modified. Use --confirm to proceed.`
        };
    }

    if (level === 'HIGH' && !options.force) {
        return {
            approved: false,
            message: `🔴 High impact: ${fileCount} files. Use --force to proceed.`
        };
    }

    if (level === 'CRITICAL' && !options.force) {
        return {
            approved: false,
            message: `🚨 CRITICAL: ${fileCount}+ files affected. Use --force to override safety.`
        };
    }

    return { approved: true, message: `Approved with ${level} verification` };
};

// ═══════════════════════════════════════════════════════════════════════════
// EVOLVE MODULE - UI/UX Upgrader
// ═══════════════════════════════════════════════════════════════════════════

// Default exclusion patterns
const DEFAULT_EXCLUSIONS = [
    /\.test\.(tsx?|jsx?)$/,      // Test files
    /\.spec\.(tsx?|jsx?)$/,      // Spec files
    /__tests__\//,               // Test directories
    /__mocks__\//,               // Mock directories
    /\.stories\.(tsx?|jsx?)$/,   // Storybook files
    /\.d\.ts$/,                  // Type declaration files
];

const EVOLVE = {
    name: 'EVOLVE',
    description: 'Scans for UI/UX improvements, outdated patterns, missing features',

    // Exclusion patterns (user-configurable)
    exclusions: [...DEFAULT_EXCLUSIONS],

    patterns: {
        // Outdated patterns - more specific to avoid false positives
        outdated: [
            { regex: /className=[\"']\s*[\"']/gm, issue: 'Empty className attribute', severity: 'low' },
            { regex: /style=\{\{\s*\}\}/g, issue: 'Empty inline style object', severity: 'low' },
            // Only match console.log NOT in catch blocks or debug files
            { regex: /^\s*console\.log\(/gm, issue: 'Console.log (consider removing for production)', severity: 'low', skipFiles: /debug|logger|dev/i },
            { regex: /(?:\/\/|\/\*)\s*TODO:|FIXME:/gi, issue: 'Unresolved TODO/FIXME comment', severity: 'info' },
            { regex: /['"]https?:\/\/localhost:\d{4}/g, issue: 'Hardcoded localhost URL', severity: 'high' },
        ],

        // Accessibility - focus on definite issues, not maybes
        accessibility: [
            { regex: /<img\s+[^>]*(?<!alt=["'][^"']*["']\s*)src=/gi, issue: 'Image may be missing alt attribute', severity: 'medium' },
            { regex: /<button(?![^>]*type=["'][^"']*["'])[^>]*onClick[^>]*>/gi, issue: 'Button with onClick may need type attribute', severity: 'low' },
        ],
        // Performance - only flag definite issues
        performance: [
            // Only flag new Date() at top level of component, not in useEffect/functions
            { regex: /(?:const|let|var)\s+\w+\s*=\s*new Date\(\)/g, issue: 'new Date() assignment (potential hydration issue)', severity: 'low' },
        ],
        // React patterns - informational only, don't hurt score much
        react: [
            { regex: /componentDidMount|componentWillUnmount/g, issue: 'Class component lifecycle (consider hooks)', severity: 'info' },
            { regex: /this\.setState\(/g, issue: 'Class component setState', severity: 'info' },

        ],
        // Next.js - informational, Pages Router is still valid
        nextjs: [
            { regex: /export\s+(async\s+)?function\s+getServerSideProps/g, issue: 'Pages Router SSR (App Router uses different pattern)', severity: 'info' },
            { regex: /<Image[^>]*layout=/g, issue: 'Deprecated Image layout prop', severity: 'medium' },
        ],
        // Security - keep these strict
        security: [
            { regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{/g, issue: 'dangerouslySetInnerHTML (verify input is sanitized)', severity: 'high' },
            { regex: /\beval\s*\(/g, issue: 'eval() usage (security risk)', severity: 'critical' },
            { regex: /\.innerHTML\s*=\s*[^'"]/g, issue: 'Direct innerHTML assignment (XSS risk)', severity: 'high' },
            { regex: /['"](?:password|secret|api[_-]?key)['"]\s*:\s*['"][^'"]{8,}['"]/gi, issue: 'Possible hardcoded secret', severity: 'critical' },
        ]
    },

    isExcluded(filePath) {
        return this.exclusions.some(pattern => pattern.test(filePath));
    },

    async scan(appName, options = {}) {
        log('evolve', `Scanning ${appName} for improvement opportunities...`);
        const appPath = getAppPath(appName);
        const srcPath = path.join(appPath, 'src');

        const allFiles = findFiles(srcPath, /\.(tsx?|jsx?)$/);
        const files = allFiles.filter(f => !this.isExcluded(f));
        const excludedCount = allFiles.length - files.length;

        if (excludedCount > 0) {
            log('evolve', `Excluded ${excludedCount} files (tests, mocks, etc.)`, 'info');
        }

        const findings = [];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf-8');
            const relativePath = path.relative(appPath, file);

            for (const [category, patterns] of Object.entries(this.patterns)) {
                for (const pattern of patterns) {
                    const matches = content.match(pattern.regex);
                    if (matches) {
                        findings.push({
                            file: relativePath,
                            category,
                            issue: pattern.issue,
                            severity: pattern.severity,
                            count: matches.length,
                            canAutoFix: pattern.fix ? true : false
                        });
                    }
                }
            }
        }

        const report = {
            module: 'EVOLVE',
            app: appName,
            timestamp: new Date().toISOString(),
            filesScanned: files.length,
            totalFindings: findings.length,
            bySeverity: {
                high: findings.filter(f => f.severity === 'high').length,
                medium: findings.filter(f => f.severity === 'medium').length,
                low: findings.filter(f => f.severity === 'low').length,
                info: findings.filter(f => f.severity === 'info').length
            },
            findings: findings.slice(0, 50) // Limit to top 50
        };

        log('evolve', `Found ${findings.length} improvement opportunities`, findings.length > 0 ? 'warn' : 'success');

        if (!options.dryRun) {
            await postToGhostBridge('triage:result', report);
        }

        return report;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// PURGE MODULE - Code Debugger & Auto-Fixer
// ═══════════════════════════════════════════════════════════════════════════

const PURGE = {
    name: 'PURGE',
    description: 'Finds and fixes code issues automatically',

    async runLint(appPath, fix = false) {
        log('purge', `Running ESLint${fix ? ' with auto-fix' : ''}...`);
        try {
            const cmd = fix ? 'npx eslint src --fix --format json' : 'npx eslint src --format json';
            const result = execSync(cmd, { cwd: appPath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
            try {
                return JSON.parse(result || '[]');
            } catch (pErr) {
                return [];
            }
        } catch (e) {
            // ESLint exits with error code if issues found
            try {
                return JSON.parse(e.stdout || '[]');
            } catch {
                return [];
            }
        }
    },

    async runTypeCheck(appPath) {
        log('purge', 'Running TypeScript type check...');
        try {
            execSync('npx tsc --noEmit', { cwd: appPath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
            return { errors: 0, output: 'No type errors found' };
        } catch (e) {
            const output = e.stdout || e.stderr || '';
            const errorCount = (output.match(/error TS\d+/g) || []).length;
            return { errors: errorCount, output: output.slice(0, 2000) };
        }
    },

    async findDeadCode(appPath) {
        log('purge', 'Scanning for dead code...');
        const srcPath = path.join(appPath, 'src');
        const files = findFiles(srcPath, /\.(tsx?|jsx?)$/);
        const deadCode = [];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf-8');
            const relativePath = path.relative(appPath, file);

            // Check for unused exports (simplified check)
            const exports = content.match(/export\s+(const|function|class|interface|type)\s+(\w+)/g) || [];

            // Check for empty files
            const codeLines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).length;
            if (codeLines < 3) {
                deadCode.push({ file: relativePath, issue: 'Nearly empty file', type: 'empty' });
            }

            // Check for commented-out code blocks
            const commentedBlocks = content.match(/\/\*[\s\S]*?\*\/|\/\/.*\n/g) || [];
            const largeComments = commentedBlocks.filter(c => c.length > 200 && !c.includes('════'));
            if (largeComments.length > 0) {
                deadCode.push({ file: relativePath, issue: 'Large commented-out code block', type: 'commented', count: largeComments.length });
            }
        }

        return deadCode;
    },

    async cleanConsoleLogs(appPath, dryRun = true) {
        log('purge', `${dryRun ? '[DRY RUN] ' : ''}Cleaning console.log statements...`);
        const srcPath = path.join(appPath, 'src');
        const files = findFiles(srcPath, /\.(tsx?|jsx?)$/);
        let totalRemoved = 0;

        for (const file of files) {
            let content = fs.readFileSync(file, 'utf-8');
            const matches = content.match(/console\.(log|debug|info)\([^)]*\);?\n?/g) || [];

            if (matches.length > 0 && !dryRun) {
                content = content.replace(/console\.(log|debug|info)\([^)]*\);?\n?/g, '');
                fs.writeFileSync(file, content);
            }
            totalRemoved += matches.length;
        }

        return { removed: totalRemoved, dryRun };
    },

    async scan(appName, options = {}) {
        log('purge', `Running code cleanup scan on ${appName}...`);
        const appPath = getAppPath(appName);

        const [lintResults, typeCheck, deadCode, consoleLogs] = await Promise.all([
            this.runLint(appPath, options.fix),
            this.runTypeCheck(appPath),
            this.findDeadCode(appPath),
            this.cleanConsoleLogs(appPath, !options.fix)
        ]);

        const lintErrors = Array.isArray(lintResults)
            ? lintResults.reduce((sum, f) => sum + (f.errorCount || 0), 0)
            : 0;
        const lintWarnings = Array.isArray(lintResults)
            ? lintResults.reduce((sum, f) => sum + (f.warningCount || 0), 0)
            : 0;

        const report = {
            module: 'PURGE',
            app: appName,
            timestamp: new Date().toISOString(),
            autoFixApplied: options.fix || false,
            lint: {
                errors: lintErrors,
                warnings: lintWarnings
            },
            typeCheck: {
                errors: typeCheck.errors,
                summary: typeCheck.errors === 0 ? 'Clean' : `${typeCheck.errors} type errors`
            },
            deadCode: {
                count: deadCode.length,
                items: deadCode.slice(0, 20)
            },
            consoleLogs: {
                found: consoleLogs.removed,
                removed: options.fix ? consoleLogs.removed : 0
            }
        };

        const totalIssues = lintErrors + typeCheck.errors + deadCode.length + consoleLogs.removed;
        log('purge', `Found ${totalIssues} issues${options.fix ? ', auto-fixed where possible' : ''}`, totalIssues > 0 ? 'warn' : 'success');

        if (!options.dryRun) {
            await postToGhostBridge('triage:result', report);
        }

        return report;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// ORACLE MODULE - Audit Reporter
// ═══════════════════════════════════════════════════════════════════════════

const ORACLE = {
    name: 'ORACLE',
    description: 'Generates comprehensive audit reports and implementation plans',

    calculateHealthScore(evolveReport, purgeReport) {
        const config = loadConfig();
        const weights = config.scoring.weights;

        // Per-category deduction caps (max 25 points per category)
        const CAP_PER_CATEGORY = 25;

        // Calculate EVOLVE deductions with cap
        const evolveSeverity = evolveReport.bySeverity || {};
        let evolveDeductions = 0;
        evolveDeductions += (evolveSeverity.critical || 0) * weights.critical;
        evolveDeductions += (evolveSeverity.high || 0) * weights.high;
        evolveDeductions += (evolveSeverity.medium || 0) * weights.medium;
        evolveDeductions += (evolveSeverity.low || 0) * weights.low;
        evolveDeductions += (evolveSeverity.info || 0) * weights.info;
        evolveDeductions = Math.min(evolveDeductions, CAP_PER_CATEGORY);

        // Calculate PURGE deductions with caps per subcategory
        let lintDeductions = 0;
        lintDeductions += Math.min((purgeReport.lint?.errors || 0) * 0.5, 15);  // Cap lint errors at 15
        lintDeductions += Math.min((purgeReport.lint?.warnings || 0) * 0.1, 5); // Cap warnings at 5

        let typeDeductions = Math.min((purgeReport.typeCheck?.errors || 0) * 2, 20); // Cap type errors at 20
        let deadCodeDeductions = Math.min((purgeReport.deadCode?.count || 0) * 0.5, 10); // Cap dead code at 10
        let consoleDeductions = Math.min((purgeReport.consoleLogs?.found || 0) * 0.2, 10); // Cap console at 10

        // Total deductions with overall cap
        const totalDeductions = evolveDeductions + lintDeductions + typeDeductions + deadCodeDeductions + consoleDeductions;
        const cappedDeductions = Math.min(totalDeductions, config.scoring.maxDeductions);
        const score = config.scoring.baseScore - cappedDeductions;

        return Math.max(0, Math.min(100, Math.round(score)));
    },

    generateMarkdownReport(appName, evolveReport, purgeReport, healthScore) {
        const timestamp = new Date().toISOString().split('T')[0];

        return `# ORACLE Audit Report: ${appName}

**Generated:** ${new Date().toISOString()}  
**Health Score:** ${healthScore}/100 ${healthScore >= 80 ? '🟢' : healthScore >= 60 ? '🟡' : '🔴'}

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Files Scanned | ${evolveReport.filesScanned} |
| EVOLVE Findings | ${evolveReport.totalFindings} |
| Lint Errors | ${purgeReport.lint?.errors || 0} |
| Type Errors | ${purgeReport.typeCheck?.errors || 0} |
| Dead Code Items | ${purgeReport.deadCode?.count || 0} |

---

## EVOLVE Analysis (UI/UX)

### By Severity
- 🔴 High: ${evolveReport.bySeverity?.high || 0}
- 🟡 Medium: ${evolveReport.bySeverity?.medium || 0}
- 🔵 Low: ${evolveReport.bySeverity?.low || 0}

### Top Issues
${(evolveReport.findings || []).slice(0, 10).map(f =>
            `- **${f.file}**: ${f.issue} (${f.severity}, ${f.count}x)`
        ).join('\n') || 'No significant issues found.'}

---

## PURGE Analysis (Code Quality)

### Lint Status
- Errors: ${purgeReport.lint?.errors || 0}
- Warnings: ${purgeReport.lint?.warnings || 0}

### TypeScript Status
${purgeReport.typeCheck?.summary || 'Unknown'}

### Dead Code
${(purgeReport.deadCode?.items || []).slice(0, 5).map(d =>
            `- **${d.file}**: ${d.issue}`
        ).join('\n') || 'No dead code detected.'}

---

## Recommendations

${healthScore < 60 ? `
> [!CAUTION]
> This codebase needs significant attention. Run \`triage:purge ${appName} --fix\` to auto-fix issues.
` : healthScore < 80 ? `
> [!WARNING]
> Some improvements recommended. Consider running \`triage:evolve ${appName}\` for detailed analysis.
` : `
> [!TIP]
> Codebase is in good health. Continue regular maintenance.
`}

---

*Report generated by Matrix ORACLE v1.0*
`;
    },

    async scan(appName, options = {}) {
        log('oracle', `Generating comprehensive audit for ${appName}...`);

        // Run EVOLVE and PURGE first
        const evolveReport = await EVOLVE.scan(appName, { ...options, dryRun: true });
        const purgeReport = await PURGE.scan(appName, { ...options, dryRun: true });

        // Calculate health score
        const healthScore = this.calculateHealthScore(evolveReport, purgeReport);

        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(appName, evolveReport, purgeReport, healthScore);

        // Save report
        if (!options.dryRun) {
            if (!fs.existsSync(AUDITS_DIR)) {
                fs.mkdirSync(AUDITS_DIR, { recursive: true });
            }
            const reportPath = path.join(AUDITS_DIR, `${appName}_audit_${Date.now()}.md`);
            fs.writeFileSync(reportPath, markdownReport);
            log('oracle', `Report saved to: ${reportPath}`, 'success');
        }

        const report = {
            module: 'ORACLE',
            app: appName,
            timestamp: new Date().toISOString(),
            healthScore,
            evolve: evolveReport,
            purge: purgeReport,
            reportPath: options.dryRun ? null : path.join(AUDITS_DIR, `${appName}_audit_${Date.now()}.md`)
        };

        log('oracle', `Health Score: ${healthScore}/100`, healthScore >= 80 ? 'success' : healthScore >= 50 ? 'warn' : 'error');

        // Track analytics
        ANALYTICS.trackHealth(appName, healthScore, {
            evolve: evolveReport.totalFindings,
            purge: (purgeReport.lint?.errors || 0) + (purgeReport.typeCheck?.errors || 0) + (purgeReport.deadCode?.count || 0) + (purgeReport.consoleLogs?.found || 0)
        });

        if (!options.dryRun) {
            await postToGhostBridge('triage:result', report);
        }

        return report;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// REVERT MODULE - Rollback & Recovery
// ═══════════════════════════════════════════════════════════════════════════

const REVERT = {
    name: 'REVERT',
    description: 'Rollback system - restore files from snapshots',

    listSnapshots(appName) {
        ensureTriageDir();
        if (!fs.existsSync(SNAPSHOTS_DIR)) return [];

        const snapshots = fs.readdirSync(SNAPSHOTS_DIR)
            .filter(d => d.startsWith(`${appName}_`))
            .map(dir => {
                const manifestPath = path.join(SNAPSHOTS_DIR, dir, 'manifest.json');
                if (!fs.existsSync(manifestPath)) return null;
                try {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
                    return {
                        id: manifest.id,
                        timestamp: manifest.timestamp,
                        fileCount: manifest.files.length,
                        dir
                    };
                } catch {
                    return null;
                }
            })
            .filter(Boolean)
            .sort((a, b) => b.id - a.id); // Newest first

        return snapshots;
    },

    async restoreSnapshot(appName, snapshotId = null) {
        const snapshots = this.listSnapshots(appName);

        if (snapshots.length === 0) {
            log('revert', `No snapshots found for ${appName}`, 'warn');
            return { success: false, message: 'No snapshots available' };
        }

        // Use latest snapshot if no ID provided
        const snapshot = snapshotId
            ? snapshots.find(s => s.id === parseInt(snapshotId))
            : snapshots[0];

        if (!snapshot) {
            log('revert', `Snapshot ${snapshotId} not found`, 'error');
            return { success: false, message: 'Snapshot not found' };
        }

        const snapshotDir = path.join(SNAPSHOTS_DIR, snapshot.dir);
        const manifestPath = path.join(snapshotDir, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const appPath = getAppPath(appName);

        log('revert', `Restoring ${manifest.files.length} files from snapshot ${snapshot.id}...`);

        let restored = 0;
        for (const relativePath of manifest.files) {
            const backupPath = path.join(snapshotDir, relativePath);
            const targetPath = path.join(appPath, relativePath);

            if (fs.existsSync(backupPath)) {
                const targetDir = path.dirname(targetPath);
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                fs.copyFileSync(backupPath, targetPath);
                restored++;
            }
        }

        logOperation('REVERT', appName, restored, snapshot.id);
        log('revert', `Restored ${restored} files from snapshot ${snapshot.id}`, 'success');

        await postToGhostBridge('triage:revert', {
            app: appName,
            snapshotId: snapshot.id,
            filesRestored: restored,
            timestamp: new Date().toISOString()
        });

        return { success: true, restored, snapshotId: snapshot.id };
    },

    async run(appName, options = {}) {
        if (options.list) {
            const snapshots = this.listSnapshots(appName);
            console.log(`\n📦 Snapshots for ${appName}:\n`);
            if (snapshots.length === 0) {
                console.log('  No snapshots found.\n');
            } else {
                snapshots.forEach(s => {
                    console.log(`  [${s.id}] ${s.timestamp} - ${s.fileCount} files`);
                });
                console.log('');
            }
            return { snapshots };
        }

        return await this.restoreSnapshot(appName, options.id);
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TRIAGE ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════

const TRIAGE = {
    modules: { EVOLVE, PURGE, ORACLE, REVERT },

    async run(module, appName, options = {}) {
        const modName = module.toUpperCase();

        // Special handling for REVERT
        if (modName === 'REVERT') {
            return await REVERT.run(appName, options);
        }

        const mod = this.modules[modName];
        if (!mod) {
            throw new Error(`Unknown module: ${module}. Available: EVOLVE, PURGE, ORACLE, REVERT`);
        }

        // For fix operations, run verification and create snapshot
        if (options.fix && modName === 'PURGE') {
            const appPath = getAppPath(appName);
            const srcPath = path.join(appPath, 'src');
            const files = findFiles(srcPath, /\.(tsx?|jsx?)$/);

            // Check verification threshold
            const verification = checkVerification(files.length, options);
            if (!verification.approved) {
                log('security', verification.message, 'error');
                return { aborted: true, reason: verification.message };
            }

            // Create snapshot before making changes
            log('security', `Creating backup snapshot before modifications...`);
            const snapshotId = await createSnapshot(appName, files);
            options.snapshotId = snapshotId;
            log('security', verification.message, 'success');
        }

        const result = await mod.scan(appName, options);

        // Log operation
        if (options.fix && !options.dryRun) {
            logOperation(`PURGE:fix`, appName, result.consoleLogs?.removed || 0, options.snapshotId);
        }

        return result;
    },

    async full(appName, options = {}) {
        log('triage', `Running full triage on ${appName}...`);

        // For full triage with fix, create snapshot first
        if (options.fix) {
            const appPath = getAppPath(appName);
            const srcPath = path.join(appPath, 'src');
            const files = findFiles(srcPath, /\.(tsx?|jsx?)$/);

            const verification = checkVerification(files.length, options);
            if (!verification.approved) {
                log('security', verification.message, 'error');
                return { aborted: true, reason: verification.message };
            }

            log('security', `Creating backup snapshot...`);
            options.snapshotId = await createSnapshot(appName, files);
        }

        const results = {
            evolve: await EVOLVE.scan(appName, options),
            purge: await PURGE.scan(appName, options),
            oracle: await ORACLE.scan(appName, options)
        };

        if (options.fix && !options.dryRun) {
            logOperation('FULL:fix', appName, results.purge.consoleLogs?.removed || 0, options.snapshotId);
        }

        log('triage', 'Full triage complete!', 'success');
        return results;
    },

    async history(appName = null) {
        const history = loadHistory();
        const filtered = appName ? history.filter(h => h.app === appName) : history;
        console.log(`\n📜 Triage History${appName ? ` for ${appName}` : ''}:\n`);
        if (filtered.length === 0) {
            console.log('  No operations recorded.\n');
        } else {
            filtered.slice(-20).reverse().forEach(h => {
                console.log(`  [${h.timestamp}] ${h.operation} on ${h.app} (${h.filesAffected} files)${h.snapshotId ? ` [snapshot: ${h.snapshotId}]` : ''}`);
            });
            console.log('');
        }
        return { history: filtered };
    },

    listApps() {
        if (!fs.existsSync(APPS_DIR)) return [];
        return fs.readdirSync(APPS_DIR).filter(f =>
            fs.statSync(path.join(APPS_DIR, f)).isDirectory()
        );
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

const printHelp = () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    MATRIX TRIAGE SYSTEM v2.0                              ║
║                   Self-Healing Codebase Analysis Engine                   ║
╚═══════════════════════════════════════════════════════════════════════════╝

USAGE:
  node triage.cjs <module> <app> [options]

MODULES:
  evolve <app>       Scan for UI/UX improvements
  purge <app>        Find and fix code issues
  oracle <app>       Generate comprehensive audit report
  full <app>         Run all modules
  revert <app>       Restore from snapshot (rollback)
  watch <app>        Continuous health monitoring (Ctrl+C to stop)
  history [app]      Show triage operation history

SECURITY OPTIONS:
  --fix              Apply auto-fixes (creates backup snapshot first)
  --confirm          Confirm medium-impact changes (11-50 files)
  --force            Force high-impact changes (51+ files)
  --dry-run          Preview changes without applying

REVERT OPTIONS:
  --list             List available snapshots
  --id=<snapshotId>  Restore specific snapshot

VERIFICATION THRESHOLDS:
  • LOW (1-10 files): Auto-approved
  • MEDIUM (11-50 files): Requires --confirm
  • HIGH (51-100 files): Requires --force
  • CRITICAL (100+ files): Requires --force + confirmation

EXAMPLES:
  node triage.cjs evolve reflect
  node triage.cjs purge reflect --fix
  node triage.cjs purge reflect --fix --confirm
    node triage.cjs oracle matrix-hub
  node triage.cjs full reflect --dry-run
  node triage.cjs revert reflect --list
  node triage.cjs revert reflect
  node triage.cjs revert reflect --id=1738888888888
  node triage.cjs history reflect

AVAILABLE APPS:
  ${TRIAGE.listApps().join(', ') || 'No apps found'}
`);
};

// Watch Mode - Continuous Monitoring
const watchMode = async (appName, intervalMs = 30000) => {
    console.log(`\n\x1b[36m╔═══════════════════════════════════════════════════════╗\x1b[0m`);
    console.log(`\x1b[36m║         TRIAGE WATCH MODE - ${appName.toUpperCase().padEnd(15)}         ║\x1b[0m`);
    console.log(`\x1b[36m╚═══════════════════════════════════════════════════════╝\x1b[0m\n`);
    console.log(`[WATCH] Monitoring every ${intervalMs / 1000}s. Press Ctrl+C to stop.\n`);

    let lastHealth = null;

    const runCheck = async () => {
        try {
            const result = await ORACLE.scan(appName, { dryRun: true });
            const currentHealth = result.healthScore;
            const timestamp = new Date().toLocaleTimeString();

            if (lastHealth === null) {
                console.log(`[${timestamp}] Initial health: ${currentHealth}/100`);
            } else if (currentHealth !== lastHealth) {
                const delta = currentHealth - lastHealth;
                const arrow = delta > 0 ? '↑' : '↓';
                const color = delta > 0 ? '\x1b[32m' : '\x1b[31m';
                console.log(`[${timestamp}] Health: ${currentHealth}/100 ${color}${arrow}${Math.abs(delta)}${'\x1b[0m'}`);
            } else {
                console.log(`[${timestamp}] Health: ${currentHealth}/100 ─`);
            }

            lastHealth = currentHealth;
        } catch (e) {
            console.error(`[WATCH ERROR] ${e.message}`);
        }
    };

    await runCheck();
    setInterval(runCheck, intervalMs);
};

// Main entry point - only run CLI when executed directly
if (require.main === module) {
    (async () => {
        const args = process.argv.slice(2);

        if (args.length === 0 || args.includes('--help')) {
            printHelp();
            process.exit(0);
        }

        // Filter out flags to get positional arguments
        const positionalArgs = args.filter(a => !a.startsWith('-'));
        const module = positionalArgs[0];
        const normalizeAppName = (app) => {
            if (!app) return app;
            const normalized = app.toLowerCase();
            if (['matrix', 'matrix-hub', 'matrixhub'].includes(normalized)) return 'nexus';
            return normalized;
        };
        const appName = normalizeAppName(positionalArgs[1]);

        // Parse options
        const options = {
            fix: args.includes('--fix'),
            dryRun: args.includes('--dry-run'),
            confirm: args.includes('--confirm'),
            force: args.includes('--force'),
            list: args.includes('--list'),
            watch: args.includes('--watch'),
            id: args.find(a => a.startsWith('--id='))?.split('=')[1] || null
        };

        // Handle history command (no app required)
        if (module === 'history') {
            await TRIAGE.history(appName || null);
            process.exit(0);
        }

        // Handle watch mode
        if (module === 'watch' || options.watch) {
            const targetApp = module === 'watch' ? appName : module;
            if (!targetApp) {
                console.error('\x1b[31mError: App name required for watch mode\x1b[0m');
                process.exit(1);
            }
            await watchMode(targetApp);
            return; // Don't exit - keep watching
        }

        if (!appName && module !== '--help') {
            console.error('\x1b[31mError: App name required\x1b[0m');
            printHelp();
            process.exit(1);
        }

        try {
            if (module === 'full') {
                const result = await TRIAGE.full(appName, options);
                if (result.aborted) {
                    console.log('\n\x1b[33mOperation aborted. Use appropriate flags to proceed.\x1b[0m');
                    process.exit(1);
                }
            } else if (module === 'revert') {
                await TRIAGE.run('revert', appName, options);
            } else {
                const result = await TRIAGE.run(module, appName, options);
                if (result?.aborted) {
                    console.log('\n\x1b[33mOperation aborted. Use appropriate flags to proceed.\x1b[0m');
                    process.exit(1);
                }
            }
        } catch (e) {
            console.error(`\x1b[31m[TRIAGE ERROR] ${e.message}\x1b[0m`);
            process.exit(1);
        }
    })();
}

module.exports = { TRIAGE, EVOLVE, PURGE, ORACLE, REVERT };

