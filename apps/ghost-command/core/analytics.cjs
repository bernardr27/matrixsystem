/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         MATRIX ANALYTICS                                  ║
 * ║                    Usage Tracking & Insights                              ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  FEATURES:                                                                ║
 * ║    • Command execution tracking                                          ║
 * ║    • Health score trends over time                                       ║
 * ║    • Deployment statistics                                               ║
 * ║    • Backup history analytics                                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const MATRIX_ROOT = path.resolve(__dirname, '..');
const ANALYTICS_DIR = path.join(MATRIX_ROOT, '.analytics');
const METRICS_FILE = path.join(ANALYTICS_DIR, 'metrics.json');
const EVENTS_FILE = path.join(ANALYTICS_DIR, 'events.json');

// Ensure analytics directory exists
if (!fs.existsSync(ANALYTICS_DIR)) {
    fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
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
    console.log(`${colors[type]}[ANALYTICS]${'\x1b[0m'} ${msg}`);
};

// Load/Save data
const loadData = (file, defaultValue = {}) => {
    if (!fs.existsSync(file)) return defaultValue;
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch { return defaultValue; }
};

const saveData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS MODULE
// ═══════════════════════════════════════════════════════════════════════════

const ANALYTICS = {
    // Track an event
    track(category, action, data = {}) {
        const events = loadData(EVENTS_FILE, []);
        const event = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            category,
            action,
            ...data
        };

        events.push(event);

        // Keep last 1000 events
        if (events.length > 1000) {
            events.splice(0, events.length - 1000);
        }

        saveData(EVENTS_FILE, events);

        // Sync to Supabase if available
        if (supabase) {
            supabase.from('matrix_analytics').insert(event).catch(() => { });
        }

        return event;
    },

    // Track health score
    trackHealth(app, score, details = {}) {
        const metrics = loadData(METRICS_FILE, { health: {} });

        if (!metrics.health[app]) {
            metrics.health[app] = [];
        }

        metrics.health[app].push({
            timestamp: new Date().toISOString(),
            score,
            ...details
        });

        // Keep last 100 entries per app
        if (metrics.health[app].length > 100) {
            metrics.health[app] = metrics.health[app].slice(-100);
        }

        saveData(METRICS_FILE, metrics);

        this.track('health', 'score_recorded', { app, score });
    },

    // Track command execution
    trackCommand(command, args, duration, success = true) {
        this.track('command', command, { args, duration, success });
    },

    // Track deployment
    trackDeploy(app, target, success, url = null) {
        this.track('deploy', success ? 'success' : 'failure', { app, target, url });
    },

    // Track backup
    trackBackup(apps, size, cloudSync = false) {
        this.track('backup', 'created', { apps, size, cloudSync });
    },

    // Get health trends
    getHealthTrends(app = null, days = 7) {
        const metrics = loadData(METRICS_FILE, { health: {} });
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const trends = {};
        const apps = app ? [app] : Object.keys(metrics.health);

        for (const appName of apps) {
            const data = metrics.health[appName] || [];
            const recent = data.filter(d => new Date(d.timestamp) > cutoff);

            if (recent.length > 0) {
                const scores = recent.map(d => d.score);
                trends[appName] = {
                    current: scores[scores.length - 1],
                    average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
                    min: Math.min(...scores),
                    max: Math.max(...scores),
                    trend: scores.length > 1 ? (scores[scores.length - 1] - scores[0]) : 0,
                    dataPoints: scores.length
                };
            }
        }

        return trends;
    },

    // Get command stats
    getCommandStats(days = 7) {
        const events = loadData(EVENTS_FILE, []);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const commands = events.filter(e =>
            e.category === 'command' && new Date(e.timestamp) > cutoff
        );

        const stats = {};
        for (const cmd of commands) {
            if (!stats[cmd.action]) {
                stats[cmd.action] = { count: 0, successRate: 0, avgDuration: 0, durations: [] };
            }
            stats[cmd.action].count++;
            if (cmd.success) stats[cmd.action].successRate++;
            if (cmd.duration) stats[cmd.action].durations.push(cmd.duration);
        }

        // Calculate averages
        for (const action in stats) {
            const s = stats[action];
            s.successRate = Math.round((s.successRate / s.count) * 100);
            s.avgDuration = s.durations.length > 0
                ? Math.round(s.durations.reduce((a, b) => a + b, 0) / s.durations.length)
                : 0;
            delete s.durations;
        }

        return stats;
    },

    // Get deploy stats
    getDeployStats(days = 30) {
        const events = loadData(EVENTS_FILE, []);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const deploys = events.filter(e =>
            e.category === 'deploy' && new Date(e.timestamp) > cutoff
        );

        const byApp = {};
        const byTarget = {};
        let successCount = 0;

        for (const d of deploys) {
            const app = d.app || 'unknown';
            const target = d.target || 'unknown';

            byApp[app] = (byApp[app] || 0) + 1;
            byTarget[target] = (byTarget[target] || 0) + 1;
            if (d.action === 'success') successCount++;
        }

        return {
            total: deploys.length,
            successRate: deploys.length > 0 ? Math.round((successCount / deploys.length) * 100) : 0,
            byApp,
            byTarget
        };
    },

    // Generate dashboard data
    getDashboard() {
        return {
            health: this.getHealthTrends(null, 7),
            commands: this.getCommandStats(7),
            deploys: this.getDeployStats(30),
            generated: new Date().toISOString()
        };
    },

    // Print insights
    showInsights() {
        const dashboard = this.getDashboard();

        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                         MATRIX ANALYTICS                                  ║
║                    Usage Insights Dashboard                               ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

        // Health Trends
        console.log('\x1b[36m📊 HEALTH TRENDS (7 days)\x1b[0m');
        console.log('─'.repeat(50));
        const health = dashboard.health;
        if (Object.keys(health).length === 0) {
            console.log('  No health data recorded yet.');
        } else {
            for (const [app, data] of Object.entries(health)) {
                const trendIcon = data.trend > 0 ? '📈' : data.trend < 0 ? '📉' : '➡️';
                const scoreColor = data.current >= 80 ? '\x1b[32m' : data.current >= 60 ? '\x1b[33m' : '\x1b[31m';
                console.log(`  ${app}: ${scoreColor}${data.current}/100\x1b[0m ${trendIcon} (avg: ${data.average}, trend: ${data.trend > 0 ? '+' : ''}${data.trend})`);
            }
        }

        // Command Stats
        console.log('\n\x1b[35m⚡ COMMAND USAGE (7 days)\x1b[0m');
        console.log('─'.repeat(50));
        const commands = dashboard.commands;
        if (Object.keys(commands).length === 0) {
            console.log('  No commands recorded yet.');
        } else {
            const sorted = Object.entries(commands).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
            for (const [cmd, stats] of sorted) {
                console.log(`  ${cmd}: ${stats.count} executions (${stats.successRate}% success)`);
            }
        }

        // Deploy Stats
        console.log('\n\x1b[33m🚀 DEPLOYMENTS (30 days)\x1b[0m');
        console.log('─'.repeat(50));
        const deploys = dashboard.deploys;
        console.log(`  Total: ${deploys.total} | Success Rate: ${deploys.successRate}%`);
        if (Object.keys(deploys.byTarget).length > 0) {
            console.log(`  By Target: ${Object.entries(deploys.byTarget).map(([t, c]) => `${t}(${c})`).join(', ')}`);
        }

        console.log('\n' + '═'.repeat(60) + '\n');
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

const printHelp = () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                         MATRIX ANALYTICS                                  ║
║                    Usage Tracking & Insights                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

USAGE:
  node analytics.cjs <command> [options]

COMMANDS:
  insights              Show analytics dashboard
  health [app]          Show health trends
  commands              Show command usage stats
  deploys               Show deployment stats
  track <category> <action> [data]  Manually track an event

OPTIONS:
  --days=<n>            Number of days to analyze (default: 7)
  --json                Output as JSON

EXAMPLES:
  node analytics.cjs insights
    node analytics.cjs health matrix-hub --days=30
  node analytics.cjs commands --json
`);
};

const normalizeAppName = (app) => {
        if (!app) return null;
        const normalized = app.toLowerCase();
        if (['matrix', 'matrix-hub', 'matrixhub'].includes(normalized)) return 'nexus';
        return normalized;
};

if (require.main === module) {
    (async () => {
        const args = process.argv.slice(2);

        if (args.length === 0 || args.includes('--help')) {
            printHelp();
            process.exit(0);
        }

        const command = args[0];
        const days = parseInt(args.find(a => a.startsWith('--days='))?.split('=')[1] || '7');
        const asJson = args.includes('--json');

        try {
            if (command === 'insights') {
                if (asJson) {
                    console.log(JSON.stringify(ANALYTICS.getDashboard(), null, 2));
                } else {
                    ANALYTICS.showInsights();
                }
            }
            else if (command === 'health') {
                const appArg = args[1] && !args[1].startsWith('--') ? args[1] : null;
                const app = normalizeAppName(appArg);
                const trends = ANALYTICS.getHealthTrends(app, days);
                if (asJson) {
                    console.log(JSON.stringify(trends, null, 2));
                } else {
                    console.log('\n📊 Health Trends:\n');
                    for (const [appName, data] of Object.entries(trends)) {
                        console.log(`  ${appName}: ${data.current}/100 (avg: ${data.average}, trend: ${data.trend > 0 ? '+' : ''}${data.trend})`);
                    }
                    console.log('');
                }
            }
            else if (command === 'commands') {
                const stats = ANALYTICS.getCommandStats(days);
                if (asJson) {
                    console.log(JSON.stringify(stats, null, 2));
                } else {
                    console.log('\n⚡ Command Stats:\n');
                    for (const [cmd, s] of Object.entries(stats)) {
                        console.log(`  ${cmd}: ${s.count} runs, ${s.successRate}% success`);
                    }
                    console.log('');
                }
            }
            else if (command === 'deploys') {
                const stats = ANALYTICS.getDeployStats(days);
                if (asJson) {
                    console.log(JSON.stringify(stats, null, 2));
                } else {
                    console.log('\n🚀 Deploy Stats:\n');
                    console.log(`  Total: ${stats.total}`);
                    console.log(`  Success Rate: ${stats.successRate}%`);
                    console.log('');
                }
            }
            else if (command === 'track') {
                const category = args[1];
                const action = args[2];
                const data = args[3] ? JSON.parse(args[3]) : {};
                if (!category || !action) throw new Error('Category and action required');
                ANALYTICS.track(category, action, data);
                log(`Event tracked: ${category}/${action}`, 'success');
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
}

module.exports = { ANALYTICS };
