/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       MATRIX ACHIEVEMENTS                                 ║
 * ║                    Gamified Health Tracking                               ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  FEATURES:                                                                ║
 * ║    • Health improvement badges                                           ║
 * ║    • Milestone achievements                                              ║
 * ║    • Progress tracking                                                   ║
 * ║    • Notification integration                                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const MATRIX_ROOT = path.resolve(__dirname, '..');
const ACHIEVEMENTS_DIR = path.join(MATRIX_ROOT, '.achievements');
const PROGRESS_FILE = path.join(ACHIEVEMENTS_DIR, 'progress.json');
const UNLOCKED_FILE = path.join(ACHIEVEMENTS_DIR, 'unlocked.json');

// Ensure directory exists
if (!fs.existsSync(ACHIEVEMENTS_DIR)) {
    fs.mkdirSync(ACHIEVEMENTS_DIR, { recursive: true });
}

// Supabase (optional)
let supabase = null;
try {
    require('dotenv').config({ path: path.join(MATRIX_ROOT, '.env') });
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    }
} catch (e) { }

// Achievement definitions
const ACHIEVEMENTS = {
    // Health milestones
    'first_scan': {
        name: 'First Steps',
        icon: '👣',
        desc: 'Run your first triage scan',
        category: 'health',
        xp: 10
    },
    'healthy_app': {
        name: 'Clean Bill of Health',
        icon: '💚',
        desc: 'Get an app to 80+ health score',
        category: 'health',
        xp: 50
    },
    'perfect_health': {
        name: 'Perfectionist',
        icon: '✨',
        desc: 'Get an app to 100 health score',
        category: 'health',
        xp: 100
    },
    'health_streak_3': {
        name: 'Consistency',
        icon: '🔥',
        desc: 'Maintain 80+ health for 3 days',
        category: 'health',
        xp: 75
    },
    'health_streak_7': {
        name: 'Unstoppable',
        icon: '🚀',
        desc: 'Maintain 80+ health for 7 days',
        category: 'health',
        xp: 150
    },
    'all_apps_healthy': {
        name: 'Matrix Master',
        icon: '👑',
        desc: 'Get all apps to 80+ health',
        category: 'health',
        xp: 200
    },

    // Deploy achievements
    'first_deploy': {
        name: 'Shipped!',
        icon: '📦',
        desc: 'Deploy your first app',
        category: 'deploy',
        xp: 25
    },
    'deploy_streak_5': {
        name: 'Deploy Machine',
        icon: '⚙️',
        desc: 'Deploy 5 times successfully',
        category: 'deploy',
        xp: 50
    },
    'prod_deploy': {
        name: 'Going Live',
        icon: '🌐',
        desc: 'Deploy to production',
        category: 'deploy',
        xp: 75
    },
    'zero_downtime': {
        name: 'Zero Downtime',
        icon: '⚡',
        desc: '10 deploys without rollback',
        category: 'deploy',
        xp: 100
    },

    // Backup achievements
    'first_backup': {
        name: 'Safety First',
        icon: '🛡️',
        desc: 'Create your first backup',
        category: 'backup',
        xp: 15
    },
    'backup_streak_7': {
        name: 'Data Guardian',
        icon: '🔒',
        desc: 'Backup for 7 consecutive days',
        category: 'backup',
        xp: 100
    },
    'cloud_warrior': {
        name: 'Cloud Warrior',
        icon: '☁️',
        desc: 'Sync 10 backups to cloud',
        category: 'backup',
        xp: 75
    },

    // Code quality
    'bug_squasher': {
        name: 'Bug Squasher',
        icon: '🐛',
        desc: 'Fix 50 issues with triage',
        category: 'quality',
        xp: 100
    },
    'lint_free': {
        name: 'Lint-Free Zone',
        icon: '✅',
        desc: 'Get 0 lint errors on any app',
        category: 'quality',
        xp: 50
    },
    'typescript_champion': {
        name: 'TypeScript Champion',
        icon: '🏆',
        desc: 'Get 0 type errors on any app',
        category: 'quality',
        xp: 75
    },

    // Meta achievements
    'night_owl': {
        name: 'Night Owl',
        icon: '🦉',
        desc: 'Run triage after midnight',
        category: 'meta',
        xp: 25
    },
    'early_bird': {
        name: 'Early Bird',
        icon: '🐦',
        desc: 'Run triage before 6 AM',
        category: 'meta',
        xp: 25
    },
    'matrix_veteran': {
        name: 'Matrix Veteran',
        icon: '🎖️',
        desc: 'Use Matrix for 30 days',
        category: 'meta',
        xp: 200
    }
};

// XP level thresholds
const LEVELS = [
    { level: 1, xp: 0, title: 'Rookie' },
    { level: 2, xp: 50, title: 'Developer' },
    { level: 3, xp: 150, title: 'Engineer' },
    { level: 4, xp: 300, title: 'Senior Engineer' },
    { level: 5, xp: 500, title: 'Architect' },
    { level: 6, xp: 750, title: 'Master' },
    { level: 7, xp: 1000, title: 'Matrix Guardian' },
    { level: 8, xp: 1500, title: 'Matrix Legend' },
];

// Data helpers
const loadProgress = () => {
    if (!fs.existsSync(PROGRESS_FILE)) {
        return {
            xp: 0,
            stats: {},
            firstSeen: new Date().toISOString()
        };
    }
    try {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch (e) {
        console.warn('[ACHIEVEMENTS] Failed to parse progress, resetting:', e.message);
        return { xp: 0, stats: {}, firstSeen: new Date().toISOString() };
    }
};

const saveProgress = (data) => {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
};

const loadUnlocked = () => {
    if (!fs.existsSync(UNLOCKED_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(UNLOCKED_FILE, 'utf-8'));
    } catch (e) {
        console.warn('[ACHIEVEMENTS] Failed to parse unlocked data, resetting:', e.message);
        return [];
    }
};

const saveUnlocked = (data) => {
    fs.writeFileSync(UNLOCKED_FILE, JSON.stringify(data, null, 2));
};

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS MODULE
// ═══════════════════════════════════════════════════════════════════════════

const MATRIX_ACHIEVEMENTS = {
    getLevel(xp) {
        let current = LEVELS[0];
        for (const level of LEVELS) {
            if (xp >= level.xp) current = level;
        }
        const next = LEVELS.find(l => l.xp > xp) || current;
        return { ...current, nextXp: next.xp, nextTitle: next.title };
    },

    unlock(achievementId) {
        const unlocked = loadUnlocked();
        if (unlocked.find(u => u.id === achievementId)) {
            return null; // Already unlocked
        }

        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return null;

        // Add to unlocked
        const unlock = {
            id: achievementId,
            ...achievement,
            unlockedAt: new Date().toISOString()
        };
        unlocked.push(unlock);
        saveUnlocked(unlocked);

        // Add XP
        const progress = loadProgress();
        progress.xp = (progress.xp || 0) + achievement.xp;
        saveProgress(progress);

        // Notify
        this.showUnlock(unlock);

        // Sync to Supabase
        if (supabase) {
            supabase.from('ghost_bridge').insert({
                command: 'achievement:unlocked',
                payload: JSON.stringify(unlock),
                status: 'complete',
                source: 'matrix_achievements'
            }).catch(() => { });
        }

        return unlock;
    },

    showUnlock(unlock) {
        const level = this.getLevel(loadProgress().xp);
        console.log(`
\x1b[33m╔═══════════════════════════════════════════════════════════════╗
║                    🏆 ACHIEVEMENT UNLOCKED! 🏆                 ║
╚═══════════════════════════════════════════════════════════════╝\x1b[0m

    ${unlock.icon}  \x1b[1m${unlock.name}\x1b[0m
    ${unlock.desc}
    
    \x1b[32m+${unlock.xp} XP\x1b[0m  →  Level ${level.level}: ${level.title}
`);
    },

    // Check and potentially unlock achievements based on events
    check(event, data = {}) {
        const progress = loadProgress();
        progress.stats = progress.stats || {};

        switch (event) {
            case 'triage_scan':
                if (!this.hasUnlocked('first_scan')) {
                    this.unlock('first_scan');
                }
                // Check time-based achievements
                const hour = new Date().getHours();
                if (hour >= 0 && hour < 5 && !this.hasUnlocked('night_owl')) {
                    this.unlock('night_owl');
                }
                if (hour >= 5 && hour < 7 && !this.hasUnlocked('early_bird')) {
                    this.unlock('early_bird');
                }
                break;

            case 'health_score':
                if (data.score >= 80 && !this.hasUnlocked('healthy_app')) {
                    this.unlock('healthy_app');
                }
                if (data.score === 100 && !this.hasUnlocked('perfect_health')) {
                    this.unlock('perfect_health');
                }
                break;

            case 'deploy':
                if (!this.hasUnlocked('first_deploy')) {
                    this.unlock('first_deploy');
                }
                progress.stats.deploys = (progress.stats.deploys || 0) + 1;
                if (progress.stats.deploys >= 5 && !this.hasUnlocked('deploy_streak_5')) {
                    this.unlock('deploy_streak_5');
                }
                if (data.prod && !this.hasUnlocked('prod_deploy')) {
                    this.unlock('prod_deploy');
                }
                break;

            case 'backup':
                if (!this.hasUnlocked('first_backup')) {
                    this.unlock('first_backup');
                }
                if (data.cloud) {
                    progress.stats.cloudBackups = (progress.stats.cloudBackups || 0) + 1;
                    if (progress.stats.cloudBackups >= 10 && !this.hasUnlocked('cloud_warrior')) {
                        this.unlock('cloud_warrior');
                    }
                }
                break;

            case 'fix_issues':
                progress.stats.issuesFixed = (progress.stats.issuesFixed || 0) + (data.count || 0);
                if (progress.stats.issuesFixed >= 50 && !this.hasUnlocked('bug_squasher')) {
                    this.unlock('bug_squasher');
                }
                break;

            case 'lint_clean':
                if (!this.hasUnlocked('lint_free')) {
                    this.unlock('lint_free');
                }
                break;

            case 'typescript_clean':
                if (!this.hasUnlocked('typescript_champion')) {
                    this.unlock('typescript_champion');
                }
                break;
        }

        saveProgress(progress);
    },

    hasUnlocked(id) {
        return loadUnlocked().some(u => u.id === id);
    },

    getProfile() {
        const progress = loadProgress();
        const unlocked = loadUnlocked();
        const level = this.getLevel(progress.xp);

        return {
            xp: progress.xp,
            level: level.level,
            title: level.title,
            nextXp: level.nextXp - progress.xp,
            unlockedCount: unlocked.length,
            totalCount: Object.keys(ACHIEVEMENTS).length,
            achievements: unlocked
        };
    },

    showProfile() {
        const profile = this.getProfile();
        const progress = (profile.xp / profile.nextXp * 100).toFixed(0);
        const bar = '█'.repeat(Math.min(20, Math.floor(profile.xp / profile.nextXp * 20))) +
            '░'.repeat(20 - Math.min(20, Math.floor(profile.xp / profile.nextXp * 20)));

        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                         MATRIX PROFILE                                    ║
╚═══════════════════════════════════════════════════════════════════════════╝

  🎮 Level ${profile.level}: \x1b[1m${profile.title}\x1b[0m
  
  XP: ${profile.xp} / ${profile.nextXp + profile.xp}
  \x1b[32m${bar}\x1b[0m ${progress}%
  
  🏆 Achievements: ${profile.unlockedCount}/${profile.totalCount}
`);

        // Show unlocked achievements
        if (profile.achievements.length > 0) {
            console.log('  \x1b[36mUnlocked:\x1b[0m');
            profile.achievements.forEach(a => {
                console.log(`    ${a.icon} ${a.name} (+${a.xp} XP)`);
            });
        }

        // Show locked achievements preview
        const locked = Object.entries(ACHIEVEMENTS)
            .filter(([id]) => !this.hasUnlocked(id))
            .slice(0, 3);

        if (locked.length > 0) {
            console.log('\n  \x1b[90mNext to unlock:\x1b[0m');
            locked.forEach(([id, a]) => {
                console.log(`    🔒 ${a.name} - ${a.desc}`);
            });
        }

        console.log('');
    },

    showAll() {
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                       ALL ACHIEVEMENTS                                    ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

        const categories = ['health', 'deploy', 'backup', 'quality', 'meta'];
        for (const cat of categories) {
            const catAchievements = Object.entries(ACHIEVEMENTS).filter(([, a]) => a.category === cat);
            console.log(`  \x1b[36m${cat.toUpperCase()}\x1b[0m`);

            for (const [id, a] of catAchievements) {
                const unlocked = this.hasUnlocked(id);
                const status = unlocked ? a.icon : '🔒';
                const color = unlocked ? '\x1b[32m' : '\x1b[90m';
                console.log(`    ${status} ${color}${a.name}\x1b[0m - ${a.desc} (${a.xp} XP)`);
            }
            console.log('');
        }
    }
};

// CLI
const printHelp = () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                       MATRIX ACHIEVEMENTS                                 ║
║                    Gamified Health Tracking                               ║
╚═══════════════════════════════════════════════════════════════════════════╝

USAGE:
  node achievements.cjs <command>

COMMANDS:
  profile               Show your profile and XP
  all                   Show all achievements
  check <event>         Check for achievement unlocks

EVENTS TO CHECK:
  triage_scan, health_score, deploy, backup, fix_issues, lint_clean
`);
};

if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === '--help') {
        printHelp();
    } else if (command === 'profile') {
        MATRIX_ACHIEVEMENTS.showProfile();
    } else if (command === 'all') {
        MATRIX_ACHIEVEMENTS.showAll();
    } else if (command === 'check') {
        MATRIX_ACHIEVEMENTS.check(args[1], args[2] ? JSON.parse(args[2]) : {});
    } else {
        console.log(`Unknown command: ${command}`);
        printHelp();
    }
}

module.exports = { ACHIEVEMENTS: MATRIX_ACHIEVEMENTS };
