/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         MATRIX TERMINAL                                   ║
 * ║                    Retro CLI Interface                                    ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  FEATURES:                                                                ║
 * ║    • Interactive command prompt                                          ║
 * ║    • Command history with arrow keys                                     ║
 * ║    • Auto-complete with TAB                                              ║
 * ║    • Unified interface for all Matrix tools                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const readline = require('readline');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MATRIX_ROOT = path.resolve(__dirname, '..');
const HISTORY_FILE = path.join(MATRIX_ROOT, '.matrix_history');

// Command registry
const COMMANDS = {
    // Triage commands
    'triage': { desc: 'Run triage scan', exec: 'node core/triage.cjs' },
    'evolve': { desc: 'Scan for improvements', exec: 'node core/triage.cjs evolve' },
    'purge': { desc: 'Clean code issues', exec: 'node core/triage.cjs purge' },
    'oracle': { desc: 'Full health audit', exec: 'node core/triage.cjs oracle' },
    'watch': { desc: 'Monitor health live', exec: 'node core/triage.cjs watch' },

    // Deployer commands
    'deploy': { desc: 'Deploy an app', exec: 'node core/deployer.cjs deploy' },
    'verify': { desc: 'Verify build', exec: 'node core/deployer.cjs verify' },
    'rollback': { desc: 'Rollback deploy', exec: 'node core/deployer.cjs rollback' },

    // Backup commands
    'backup': { desc: 'Create backup', exec: 'node core/backup.cjs create' },
    'restore': { desc: 'Restore backup', exec: 'node core/backup.cjs restore' },
    'backups': { desc: 'List backups', exec: 'node core/backup.cjs list' },

    // Analytics
    'insights': { desc: 'Show analytics', exec: 'node core/analytics.cjs insights' },
    'stats': { desc: 'Command stats', exec: 'node core/analytics.cjs commands' },

    // Sentinel
    'sentinel': { desc: 'Start Sentinel', exec: 'node core/sentinel.cjs' },
    'status': { desc: 'System status', exec: 'node core/pulse.cjs status' },
    'cap': { desc: 'Capability engine (video-derived upgrades)', exec: 'node core/capability-engine.cjs' },

    // Built-in commands
    'help': { desc: 'Show help', builtin: true },
    'clear': { desc: 'Clear screen', builtin: true },
    'exit': { desc: 'Exit terminal', builtin: true },
    'cd': { desc: 'Change directory', builtin: true },
    'ls': { desc: 'List files', builtin: true },
    'apps': { desc: 'List Matrix apps', builtin: true },
    'health': { desc: 'Quick health check', builtin: true },
};

// History management
let history = [];
let historyIndex = -1;

const loadHistory = () => {
    if (fs.existsSync(HISTORY_FILE)) {
        history = fs.readFileSync(HISTORY_FILE, 'utf-8').split('\n').filter(Boolean);
    }
};

const saveHistory = () => {
    fs.writeFileSync(HISTORY_FILE, history.slice(-100).join('\n'));
};

const addToHistory = (cmd) => {
    if (cmd && cmd !== history[history.length - 1]) {
        history.push(cmd);
        saveHistory();
    }
    historyIndex = history.length;
};

// Auto-complete
const getCompletions = (line) => {
    const parts = line.split(' ');
    const lastPart = parts[parts.length - 1].toLowerCase();

    if (parts.length === 1) {
        // Complete command names
        return Object.keys(COMMANDS).filter(c => c.startsWith(lastPart));
    } else {
        // Complete app names
        const appsDir = path.join(MATRIX_ROOT, 'apps');
        if (fs.existsSync(appsDir)) {
            const apps = fs.readdirSync(appsDir).filter(d =>
                fs.statSync(path.join(appsDir, d)).isDirectory()
            );
            return apps.filter(a => a.startsWith(lastPart));
        }
    }
    return [];
};

// Display helpers
const printBanner = () => {
    console.log('\x1b[32m');
    console.log(`
 ███╗   ███╗ █████╗ ████████╗██████╗ ██╗██╗  ██╗
 ████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██║╚██╗██╔╝
 ██╔████╔██║███████║   ██║   ██████╔╝██║ ╚███╔╝ 
 ██║╚██╔╝██║██╔══██║   ██║   ██╔══██╗██║ ██╔██╗ 
 ██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║██║██╔╝ ██╗
 ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
`);
    console.log('\x1b[0m');
    console.log('  \x1b[36mMatrix Terminal v1.0\x1b[0m - Type \x1b[33mhelp\x1b[0m for commands\n');
};

const printHelp = () => {
    console.log('\n\x1b[36m╔═══════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[36m║                AVAILABLE COMMANDS                     ║\x1b[0m');
    console.log('\x1b[36m╚═══════════════════════════════════════════════════════╝\x1b[0m\n');

    const categories = {
        'TRIAGE': ['triage', 'evolve', 'purge', 'oracle', 'watch', 'health'],
        'DEPLOY': ['deploy', 'verify', 'rollback'],
        'BACKUP': ['backup', 'restore', 'backups'],
        'SYSTEM': ['sentinel', 'status', 'insights', 'stats'],
        'CAPABILITIES': ['cap'],
        'SHELL': ['help', 'clear', 'exit', 'cd', 'ls', 'apps']
    };

    for (const [cat, cmds] of Object.entries(categories)) {
        console.log(`  \x1b[33m${cat}\x1b[0m`);
        for (const cmd of cmds) {
            if (COMMANDS[cmd]) {
                console.log(`    \x1b[32m${cmd.padEnd(12)}\x1b[0m ${COMMANDS[cmd].desc}`);
            }
        }
        console.log('');
    }

    console.log('  \x1b[90mTIP: Use TAB for auto-complete, ↑↓ for history\x1b[0m\n');
};

const listApps = () => {
    const appsDir = path.join(MATRIX_ROOT, 'apps');
    if (!fs.existsSync(appsDir)) {
        console.log('  No apps directory found.');
        return;
    }

    const apps = fs.readdirSync(appsDir).filter(d =>
        fs.statSync(path.join(appsDir, d)).isDirectory()
    );

    console.log('\n\x1b[36m  MATRIX APPS:\x1b[0m');
    apps.forEach(app => {
        const pkgPath = path.join(appsDir, app, 'package.json');
        const hasPackage = fs.existsSync(pkgPath);
        const icon = hasPackage ? '📦' : '📁';
        console.log(`    ${icon} ${app}`);
    });
    console.log('');
};

const quickHealth = async () => {
    console.log('\n\x1b[36m  HEALTH CHECK:\x1b[0m');
    try {
        const { TRIAGE, ORACLE } = require('./triage.cjs');
        const apps = TRIAGE.listApps();

        for (const app of apps.slice(0, 3)) {
            try {
                const result = await ORACLE.scan(app, { dryRun: true, quiet: true });
                const score = result.healthScore;
                const color = score >= 80 ? '\x1b[32m' : score >= 60 ? '\x1b[33m' : '\x1b[31m';
                const bar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
                console.log(`    ${app.padEnd(15)} ${color}${bar} ${score}%\x1b[0m`);
            } catch {
                console.log(`    ${app.padEnd(15)} \x1b[90m[skipped]\x1b[0m`);
            }
        }
    } catch (e) {
        console.log('    \x1b[31mError loading triage module\x1b[0m');
    }
    console.log('');
};

// Command execution
const executeCommand = async (input) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    addToHistory(trimmed);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Built-in commands
    if (cmd === 'help') {
        printHelp();
        return;
    }
    if (cmd === 'clear') {
        console.clear();
        printBanner();
        return;
    }
    if (cmd === 'exit' || cmd === 'quit') {
        console.log('\n\x1b[32m  Goodbye! 👋\x1b[0m\n');
        process.exit(0);
    }
    if (cmd === 'cd') {
        if (args[0]) {
            try {
                process.chdir(args[0]);
                console.log(`  → ${process.cwd()}`);
            } catch (e) {
                console.log(`  \x1b[31mDirectory not found: ${args[0]}\x1b[0m`);
            }
        } else {
            console.log(`  ${process.cwd()}`);
        }
        return;
    }
    if (cmd === 'ls') {
        const dir = args[0] || '.';
        try {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const isDir = fs.statSync(path.join(dir, item)).isDirectory();
                console.log(`  ${isDir ? '📁' : '📄'} ${item}`);
            });
        } catch (e) {
            console.log(`  \x1b[31mCannot list: ${dir}\x1b[0m`);
        }
        return;
    }
    if (cmd === 'apps') {
        listApps();
        return;
    }
    if (cmd === 'health') {
        await quickHealth();
        return;
    }

    // Matrix commands
    if (COMMANDS[cmd] && COMMANDS[cmd].exec) {
        const fullCmd = `${COMMANDS[cmd].exec} ${args.join(' ')}`.trim();
        console.log(`\x1b[90m  → ${fullCmd}\x1b[0m\n`);

        try {
            execSync(fullCmd, {
                cwd: MATRIX_ROOT,
                stdio: 'inherit',
                env: { ...process.env, FORCE_COLOR: '1' },
                encoding: 'utf8',
                windowsHide: true
            });
        } catch (e) {
            // Error already printed by child process
        }
        return;
    }

    // Pass-through to shell
    try {
        execSync(trimmed, {
            cwd: process.cwd(),
            stdio: 'inherit',
            shell: true
        });
    } catch (e) {
        if (e.status !== 0) {
            console.log(`\x1b[31m  Command failed with exit code ${e.status}\x1b[0m`);
        }
    }
};

// Main REPL
const startTerminal = () => {
    loadHistory();
    console.clear();
    printBanner();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: (line) => {
            const completions = getCompletions(line);
            return [completions, line.split(' ').pop()];
        },
        prompt: '\x1b[32mmatrix\x1b[0m \x1b[36m>\x1b[0m '
    });

    rl.prompt();

    rl.on('line', async (line) => {
        await executeCommand(line);
        rl.prompt();
    });

    rl.on('close', () => {
        console.log('\n\x1b[32m  Goodbye! 👋\x1b[0m\n');
        process.exit(0);
    });

    // Handle history navigation
    process.stdin.on('keypress', (str, key) => {
        if (key.name === 'up' && history.length > 0) {
            if (historyIndex > 0) historyIndex--;
            rl.write(null, { ctrl: true, name: 'u' });
            rl.write(history[historyIndex] || '');
        } else if (key.name === 'down') {
            if (historyIndex < history.length - 1) historyIndex++;
            else historyIndex = history.length;
            rl.write(null, { ctrl: true, name: 'u' });
            rl.write(history[historyIndex] || '');
        }
    });
};

// Start
if (require.main === module) {
    startTerminal();
}

module.exports = { COMMANDS, executeCommand };
