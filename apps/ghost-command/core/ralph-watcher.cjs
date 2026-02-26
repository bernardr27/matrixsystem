const path = require('path');
const fs = require('fs');

/**
 * RalphWatcher
 * Background service that monitors docs/prd for new missions.
 */
class RalphWatcher {
    constructor(ralphLoop) {
        this.loop = ralphLoop;
        this.prdDir = path.join(__dirname, '..', '..', 'docs', 'prd');
        this.isScanning = false;
    }

    start(intervalMs = 60000) {
        console.log('[RALPH_WATCHER] Started. Scanning every ' + intervalMs + 'ms');
        setInterval(() => this.scan(), intervalMs);
        this.scan(); // Initial scan
    }

    async scan() {
        if (this.isScanning) return;
        this.isScanning = true;

        try {
            const files = fs.readdirSync(this.prdDir).filter(f => f.endsWith('.md'));

            for (const file of files) {
                const prdPath = path.join(this.prdDir, file);
                const progressPath = path.join(this.prdDir, 'progress', `${path.basename(file, '.md')}_progress.txt`);

                let isComplete = false;
                if (fs.existsSync(progressPath)) {
                    const progress = fs.readFileSync(progressPath, 'utf8');
                    isComplete = progress.includes('<promise>COMPLETE</promise>');
                }

                if (!isComplete) {
                    console.log(`[RALPH_WATCHER] Triggering loop for: ${file}`);
                    // Note: This needs a 'fake' command object as RalphLoop expects one
                    const mockCmd = {
                        id: `auto_${Date.now()}_${file.substring(0, 5)}`,
                        command: `ralph:loop ${prdPath}`,
                        user_id: 'SYSTEM_WATCHER'
                    };
                    await this.loop.run(mockCmd);
                }
            }
        } catch (err) {
            console.error('[RALPH_WATCHER] Scan error:', err);
        } finally {
            this.isScanning = false;
        }
    }
}

module.exports = RalphWatcher;
