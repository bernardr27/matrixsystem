/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                          MATRIX BACKUP                                    ║
 * ║                    Automated Backup System                                ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  FEATURES:                                                                ║
 * ║    • Full codebase backups (excluding node_modules, .next, etc)          ║
 * ║    • Scheduled automatic backups                                         ║
 * ║    • Cloud sync to Supabase Storage                                      ║
 * ║    • Restore from any backup point                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const { ANALYTICS } = require('./analytics.cjs');

// Configuration
const MATRIX_ROOT = path.resolve(__dirname, '..');
const APPS_DIR = path.join(MATRIX_ROOT, 'apps');
const BACKUPS_DIR = path.join(MATRIX_ROOT, '.backups');
const CONFIG_FILE = path.join(MATRIX_ROOT, 'backup.config.json');

// Ensure backup directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Exclusion patterns
const EXCLUDE_PATTERNS = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    '.turbo',
    '*.log',
    '.env*',
    '.backups',
    '.deploys'
];

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
    console.log(`${colors[type]}[BACKUP]${'\x1b[0m'} ${msg}`);
};

// Load config
const loadConfig = () => {
    const defaults = {
        schedule: { enabled: false, cron: '0 2 * * *' }, // 2 AM daily
        retention: { local: 7, cloud: 30 }, // days
        cloud: { enabled: false, bucket: 'matrix-backups' },
        apps: [] // Empty = all apps
    };

    if (!fs.existsSync(CONFIG_FILE)) return defaults;
    try {
        return { ...defaults, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) };
    } catch { return defaults; }
};

// ═══════════════════════════════════════════════════════════════════════════
// BACKUP MODULE
// ═══════════════════════════════════════════════════════════════════════════

const BACKUP = {
    listApps() {
        if (!fs.existsSync(APPS_DIR)) return [];
        return fs.readdirSync(APPS_DIR).filter(d =>
            fs.statSync(path.join(APPS_DIR, d)).isDirectory()
        );
    },

    shouldExclude(filePath) {
        const relative = path.relative(MATRIX_ROOT, filePath);
        return EXCLUDE_PATTERNS.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                return regex.test(relative);
            }
            return relative.includes(pattern);
        });
    },

    collectFiles(dir, baseDir = dir) {
        const files = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            if (this.shouldExclude(fullPath)) continue;

            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                files.push(...this.collectFiles(fullPath, baseDir));
            } else {
                files.push({
                    path: fullPath,
                    relative: path.relative(baseDir, fullPath),
                    size: stat.size
                });
            }
        }
        return files;
    },

    async create(appName = null, options = {}) {
        const config = loadConfig();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupId = `backup_${timestamp}`;
        const backupDir = path.join(BACKUPS_DIR, backupId);

        log(`Creating backup: ${backupId}`);
        fs.mkdirSync(backupDir, { recursive: true });

        const apps = appName ? [appName] : (config.apps.length ? config.apps : this.listApps());
        const manifest = {
            id: backupId,
            timestamp: new Date().toISOString(),
            apps: [],
            totalFiles: 0,
            totalSize: 0
        };

        for (const app of apps) {
            const appPath = path.join(APPS_DIR, app);
            if (!fs.existsSync(appPath)) {
                log(`App not found: ${app}`, 'warn');
                continue;
            }

            log(`Backing up ${app}...`);
            const appBackupDir = path.join(backupDir, app);
            fs.mkdirSync(appBackupDir, { recursive: true });

            const files = this.collectFiles(appPath);
            let appSize = 0;

            for (const file of files) {
                const destPath = path.join(appBackupDir, file.relative);
                const destDir = path.dirname(destPath);

                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
                fs.copyFileSync(file.path, destPath);
                appSize += file.size;
            }

            manifest.apps.push({
                name: app,
                files: files.length,
                size: appSize
            });
            manifest.totalFiles += files.length;
            manifest.totalSize += appSize;

            log(`  ✓ ${app}: ${files.length} files (${(appSize / 1024 / 1024).toFixed(2)} MB)`, 'success');
        }

        // Also backup core directory
        if (!appName) {
            log('Backing up core...');
            const coreDir = path.join(MATRIX_ROOT, 'core');
            const coreBackupDir = path.join(backupDir, 'core');
            fs.mkdirSync(coreBackupDir, { recursive: true });

            const coreFiles = this.collectFiles(coreDir);
            for (const file of coreFiles) {
                const destPath = path.join(coreBackupDir, file.relative);
                fs.mkdirSync(path.dirname(destPath), { recursive: true });
                fs.copyFileSync(file.path, destPath);
            }
            manifest.apps.push({ name: 'core', files: coreFiles.length });
            manifest.totalFiles += coreFiles.length;
            log(`  ✓ core: ${coreFiles.length} files`, 'success');
        }

        // Save manifest
        fs.writeFileSync(
            path.join(backupDir, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );

        log(`\n✅ Backup complete: ${manifest.totalFiles} files (${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB)`, 'success');

        // Track analytics
        ANALYTICS.trackBackup(apps, manifest.totalSize, config.cloud.enabled);

        // Cloud sync if enabled
        if (config.cloud.enabled && supabase) {
            await this.syncToCloud(backupId);
        }

        // Cleanup old backups
        await this.cleanup();

        return manifest;
    },

    async syncToCloud(backupId) {
        if (!supabase) {
            log('Cloud sync unavailable: Supabase not configured', 'warn');
            return;
        }

        log('Syncing to cloud...');
        const config = loadConfig();
        const backupDir = path.join(BACKUPS_DIR, backupId);

        // Create a tar archive
        const archivePath = path.join(BACKUPS_DIR, `${backupId}.tar.gz`);
        try {
            execSync(`tar -czf "${archivePath}" -C "${BACKUPS_DIR}" "${backupId}"`, { stdio: 'pipe', windowsHide: true });
        } catch (e) {
            log('Failed to create archive (tar not available)', 'warn');
            return;
        }

        // Upload to Supabase Storage
        try {
            const fileBuffer = fs.readFileSync(archivePath);
            const { error } = await supabase.storage
                .from(config.cloud.bucket)
                .upload(`${backupId}.tar.gz`, fileBuffer, {
                    contentType: 'application/gzip',
                    upsert: true
                });

            if (error) throw error;
            log(`☁️ Uploaded to cloud: ${backupId}.tar.gz`, 'success');

            // Clean up local archive
            fs.unlinkSync(archivePath);
        } catch (e) {
            log(`Cloud upload failed: ${e.message}`, 'error');
        }
    },

    async list() {
        if (!fs.existsSync(BACKUPS_DIR)) {
            console.log('\n📦 No backups found.\n');
            return [];
        }

        const backups = fs.readdirSync(BACKUPS_DIR)
            .filter(d => d.startsWith('backup_'))
            .map(d => {
                const manifestPath = path.join(BACKUPS_DIR, d, 'manifest.json');
                if (!fs.existsSync(manifestPath)) return null;
                try {
                    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
                } catch (e) {
                    log(`Corrupt manifest found in ${d}, skipping.`, 'warn');
                    return null;
                }
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        console.log('\n📦 Local Backups:\n');
        if (backups.length === 0) {
            console.log('  No backups found.\n');
        } else {
            backups.forEach(b => {
                const date = new Date(b.timestamp).toLocaleString();
                const size = (b.totalSize / 1024 / 1024).toFixed(2);
                console.log(`  ${b.id}`);
                console.log(`     📅 ${date}  |  📁 ${b.totalFiles} files  |  💾 ${size} MB`);
                console.log(`     Apps: ${b.apps.map(a => a.name).join(', ')}`);
                console.log('');
            });
        }

        return backups;
    },

    async restore(backupId, appName = null) {
        const backupDir = path.join(BACKUPS_DIR, backupId);

        if (!fs.existsSync(backupDir)) {
            log(`Backup not found: ${backupId}`, 'error');
            return { success: false };
        }

        const manifest = JSON.parse(
            fs.readFileSync(path.join(backupDir, 'manifest.json'), 'utf-8')
        );

        log(`Restoring from ${backupId}...`);

        const apps = appName
            ? manifest.apps.filter(a => a.name === appName)
            : manifest.apps;

        for (const app of apps) {
            const backupAppDir = path.join(backupDir, app.name);
            const targetDir = app.name === 'core'
                ? path.join(MATRIX_ROOT, 'core')
                : path.join(APPS_DIR, app.name);

            if (!fs.existsSync(backupAppDir)) {
                log(`Backup for ${app.name} not found`, 'warn');
                continue;
            }

            log(`Restoring ${app.name}...`);

            // Copy files back
            const files = this.collectFiles(backupAppDir);
            for (const file of files) {
                const destPath = path.join(targetDir, file.relative);
                const destDir = path.dirname(destPath);

                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
                fs.copyFileSync(file.path, destPath);
            }

            log(`  ✓ ${app.name}: ${files.length} files restored`, 'success');
        }

        log('\n✅ Restore complete!', 'success');
        return { success: true, manifest };
    },

    async cleanup() {
        const config = loadConfig();
        const maxAge = config.retention.local * 24 * 60 * 60 * 1000; // days to ms
        const now = Date.now();

        const backups = fs.readdirSync(BACKUPS_DIR)
            .filter(d => d.startsWith('backup_'));

        let removed = 0;
        for (const backup of backups) {
            const manifestPath = path.join(BACKUPS_DIR, backup, 'manifest.json');
            if (!fs.existsSync(manifestPath)) continue;

            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            const age = now - new Date(manifest.timestamp).getTime();

            if (age > maxAge) {
                fs.rmSync(path.join(BACKUPS_DIR, backup), { recursive: true });
                removed++;
            }
        }

        if (removed > 0) {
            log(`Cleaned up ${removed} old backup(s)`, 'info');
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

const printHelp = () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                          MATRIX BACKUP                                    ║
║                    Automated Backup System                                ║
╚═══════════════════════════════════════════════════════════════════════════╝

USAGE:
  node backup.cjs <command> [app] [options]

COMMANDS:
  create [app]          Create a new backup (all apps if none specified)
  list                  List all local backups
  restore <backupId>    Restore from a backup
  sync <backupId>       Sync a backup to cloud storage
  cleanup               Remove old backups based on retention policy

OPTIONS:
  --cloud               Also sync to cloud after creating backup

EXAMPLES:
  node backup.cjs create                    # Backup all apps
  node backup.cjs create reflect            # Backup only reflect
  node backup.cjs list                      # Show all backups
  node backup.cjs restore backup_2026-02-06T21-30-00-000Z
  node backup.cjs create --cloud            # Create + cloud sync

CONFIGURATION:
  Edit backup.config.json to configure:
  - Scheduled backups (cron)
  - Retention periods (local/cloud)
  - Cloud sync settings
`);
};

(async () => {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        printHelp();
        process.exit(0);
    }

    const command = args[0];
    const target = args[1];

    try {
        if (command === 'create') {
            await BACKUP.create(target, {
                cloud: args.includes('--cloud')
            });
        }
        else if (command === 'list') {
            await BACKUP.list();
        }
        else if (command === 'restore') {
            if (!target) throw new Error('Backup ID required');
            await BACKUP.restore(target, args[2]);
        }
        else if (command === 'sync') {
            if (!target) throw new Error('Backup ID required');
            await BACKUP.syncToCloud(target);
        }
        else if (command === 'cleanup') {
            await BACKUP.cleanup();
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

module.exports = { BACKUP };
