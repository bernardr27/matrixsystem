const path = require('path');
const fs = require('fs');

const RalphLoop = require('./ralph-loop.cjs');
const Voice = require('../voice.cjs');

class RalphHandler {
    constructor(supabase, context) {
        this.supabase = supabase;
        this.context = context; // { agent }
        this.agent = context.agent; // RalphAgent instance
        this.lastAudit = null;
        this.lastFix = null;
        this.loop = new RalphLoop(this, context.aiHandler, context); // Pass self + AI handler
    }

    async handle(cmd) {
        const command = (cmd.command || '').trim();
        const lowerCmd = command.toLowerCase();

        // 1. Direct Command Routing
        if (lowerCmd === 'ralph:audit') return this.audit(cmd);
        if (lowerCmd.startsWith('ralph:locate ')) return this.locate(command, cmd);
        if (lowerCmd === 'ralph:fix') return this.fix(cmd);
        if (lowerCmd === 'ralph:apply') return this.apply(cmd);
        if (lowerCmd === 'ralph:scan') return this.systemScan(cmd);  // Default scan → real system scan
        if (lowerCmd === 'ralph:visual_scan') return this.visualScan(cmd); // Vision-based scan
        if (lowerCmd === 'ralph:simulate_scan') return this.visualScan(cmd, true); // Non-destructive simulation
        if (lowerCmd === 'ralph:purge_shadows') return this.purgeShadows(cmd);
        if (lowerCmd === 'ralph:undo') return this.undo(cmd);
        if (lowerCmd === 'ralph:scan_network') return this.scanNetwork(cmd);
        if (lowerCmd === 'ralph:optimize_db') return this.optimizeDb(cmd);
        if (lowerCmd === 'ralph:system_scan') return this.systemScan(cmd);

        // File Manipulation Commands
        if (lowerCmd.startsWith('ralph:read ')) return this.fileRead(cmd);
        if (lowerCmd.startsWith('ralph:write ')) return this.fileWrite(cmd);
        if (lowerCmd.startsWith('ralph:rename ')) return this.fileRename(cmd);
        if (lowerCmd.startsWith('ralph:delete ')) return this.fileDelete(cmd);
        if (lowerCmd.startsWith('ralph:ls ') || lowerCmd === 'ralph:ls') return this.fileLs(cmd);
        if (lowerCmd.startsWith('ralph:ls ') || lowerCmd === 'ralph:ls') return this.fileLs(cmd);


        // ... (inside handle)
        if (lowerCmd.startsWith('ralph:mkdir ')) return this.fileMkdir(cmd);
        if (lowerCmd.startsWith('ralph:download ')) return this.fileDownload(cmd);
        if (lowerCmd.startsWith('ralph:exec ')) return this.exec(cmd); // New Shell Capability
        if (lowerCmd.startsWith('ralph:loop ')) return this.loop.run(cmd);

        // 2. Intent Detection for Natural Language
        const query = lowerCmd.replace('ralph:', '').trim();

        // Handle "Yes/Proceed" for fixes
        const isConfirm = ['yes', 'yep', 'proceed', 'do it', 'apply', 'fix it', 'go ahead', 'y'].some(k => query === k || query.startsWith(k + ' '));
        if (this.lastFix && isConfirm) {
            console.log(`[RALPH] Confirmation detected: "${query}". Executing fix on ${this.lastFix.targetFile}`);
            return this.apply(cmd);
        }

        // Handle Scan/Audit intents
        const isScan = ['scan', 'full scan', 'system scan', 'check system', 'diagnostics', 'system check'].some(k => query === k);
        if (isScan) return this.systemScan(cmd);

        const isVisualScan = ['audit', 'look', 'visual scan', 'check screen', 'visual audit'].some(k => query === k || query.startsWith(k + ' '));
        if (isVisualScan) return this.visualScan(cmd);

        if (query) {
            return this.chat(cmd, query);
        }

        await this.updateStatus(cmd.id, 'failed', 'RALPH: UNKNOWN_ACTION. Try "scan", "audit", or ask me a question.');
    }

    // --- AUDIT: Visual inspection ---
    async audit(cmd) {
        await this.updateStatus(cmd.id, 'executing', '👁️ RALPH: Visual Cortex Active. Capturing screen...');

        try {
            const result = await this.agent.audit();
            if (!result.success) {
                throw new Error(result.error);
            }
            this.lastAudit = result;

            // --- Enhanced Context & Severity Analysis ---
            const analysis = result.analysis || {};
            const defectCount = Array.isArray(analysis.defects) ? analysis.defects.length : 0;
            const summary = analysis.summary || "No defects found.";
            const severity = analysis.severity || "unknown";
            const affectedComponents = analysis.affected_components || [];
            const historical = analysis.historical || null;
            const triageScore = typeof analysis.triage_score === 'number' ? analysis.triage_score : null;

            // --- Oracle/Triage Integration ---
            let healthScore = null;
            try {
                // If triage scoring is available, use it; otherwise, estimate
                if (triageScore !== null) {
                    healthScore = triageScore;
                } else {
                    // Simple heuristic: fewer defects = higher score
                    healthScore = Math.max(0, 100 - (defectCount * 10));
                }
                // Optionally, log to triage/oracle system (pseudo-code, adapt as needed)
                if (this.context.oracle) {
                    await this.context.oracle.logAudit({
                        timestamp: new Date().toISOString(),
                        summary,
                        severity,
                        defectCount,
                        affectedComponents,
                        healthScore,
                        source: 'ralph-audit',
                        details: analysis
                    });
                }
            } catch (triageErr) {
                // Non-fatal, just log
                console.warn('[RALPH] Oracle/Triage integration failed:', triageErr);
            }

            // --- Output Formatting ---
            let output = `🔍 RALPH AUDIT COMPLETE\n\n`;
            output += `SUMMARY: ${summary}\n`;
            output += `SEVERITY: ${severity.toUpperCase()}\n`;
            output += `DEFECTS (${defectCount}):\n`;
            if (analysis.defects) {
                output += analysis.defects.map((d, i) => `${i + 1}. ${d}`).join('\n');
            }
            if (affectedComponents.length > 0) {
                output += `\n\nAFFECTED COMPONENTS: ${affectedComponents.join(', ')}`;
            }
            if (historical) {
                output += `\n\nHISTORICAL: ${historical}`;
            }
            if (typeof healthScore === 'number') {
                output += `\n\nHEALTH SCORE: ${healthScore}/100`;
            }
            if (analysis.specific_text && analysis.specific_text.length > 0) {
                output += `\n\nKEYS: ${analysis.specific_text.join(', ')}`;
            }
            output += `\n\n💡 Commands:\n• ralph:fix → Generate code fix\n• ralph:scan → Full pipeline (audit+locate+fix)`;

            await this.updateStatus(cmd.id, 'executed', output);

        } catch (e) {
            console.error('[RALPH] Audit failed:', e);
            await this.updateStatus(cmd.id, 'failed', `RALPH_FAIL: ${e.message}`);
        }
    }

    // --- FIX: Generate a code fix proposal ---
    async fix(cmd) {
        if (!this.lastAudit || !this.lastAudit.analysis) {
            return this.updateStatus(cmd.id, 'failed', 'RALPH: No recent audit. Run "ralph:audit" first.');
        }

        const analysis = this.lastAudit.analysis;
        const defects = analysis.defects || [];
        const keys = analysis.specific_text || [];

        if (defects.length === 0) {
            return this.updateStatus(cmd.id, 'executed', 'RALPH: No defects to fix. ✅');
        }

        await this.updateStatus(cmd.id, 'executing', '🧠 RALPH: Analyzing defects and hunting for source code...');

        try {
            // 1. Locate File
            let targetFile = null;
            if (this.lastAudit.targetFile) {
                targetFile = this.lastAudit.targetFile;
            } else {
                for (const key of keys) {
                    const files = await this.agent.locate(key);
                    if (files && files.length > 0) {
                        targetFile = files[0]; // Best match
                        break;
                    }
                }
            }

            if (!targetFile) {
                return this.updateStatus(cmd.id, 'failed', 'RALPH: Could not locate source file for these defects (no matching text found).');
            }

            await this.updateStatus(cmd.id, 'executing', `🧠 RALPH: Generating fix for ${targetFile}...`);

            const absPath = path.isAbsolute(targetFile)
                ? targetFile
                : path.join(__dirname, '..', '..', '..', targetFile);

            if (!fs.existsSync(absPath)) {
                return this.updateStatus(cmd.id, 'failed', `RALPH: Source file not found: ${absPath}`);
            }

            const content = fs.readFileSync(absPath, 'utf8');

            // 3. Generate fix using Groq/Ollama
            const fixResult = await this.agent.generateFix(targetFile, defects, content);

            if (!fixResult.fix) {
                return this.updateStatus(cmd.id, 'failed', `RALPH: Fix generation failed — ${fixResult.error || 'unknown error'}`);
            }

            this.lastFix = { targetFile: absPath, fixData: fixResult.fix, source: fixResult.source };

            // 4. Format output
            const fixes = Array.isArray(fixResult.fix) ? fixResult.fix : [fixResult.fix];
            let output = `🔧 RALPH FIX PROPOSAL [via ${fixResult.source?.toUpperCase()}]\n`;
            output += `📁 Target: ${targetFile}\n\n`;

            fixes.forEach((f, i) => {
                output += `--- Fix ${i + 1} (${f.confidence || '?'} confidence) ---\n`;
                output += `${f.explanation || 'No explanation'}\n`;
                output += `SEARCH: "${(f.search || '').substring(0, 80)}..."\n`;
                output += `REPLACE: "${(f.replace || '').substring(0, 80)}..."\n\n`;
            });

            output += `\nRun "ralph:apply" to execute this fix.`;

            await this.updateStatus(cmd.id, 'executed', output);

        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_FIX_FAIL: ${e.message}`);
        }
    }

    // --- APPLY: Write the last proposed fix to disk ---
    async apply(cmd) {
        if (!this.lastFix) {
            return this.updateStatus(cmd.id, 'failed', 'RALPH: No fix to apply. Run "ralph:fix" first.');
        }

        await this.updateStatus(cmd.id, 'executing', '⚡ RALPH: Applying fix patch...');

        try {
            const fixData = Array.isArray(this.lastFix.fixData) ? this.lastFix.fixData : [this.lastFix.fixData];
            const result = this.agent.applyFix(this.lastFix.targetFile, fixData);

            if (result.success) {
                await this.updateStatus(cmd.id, 'executed',
                    `✅ RALPH APPLIED ${result.applied}/${result.total} fix(es) to ${path.basename(this.lastFix.targetFile)}\n` +
                    `📦 Backup created: ${path.basename(result.backup)}\n` +
                    `💡 Run "ralph:undo" to revert.`
                );
            } else {
                await this.updateStatus(cmd.id, 'failed', `RALPH_APPLY_FAIL: ${result.error}`);
            }
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_APPLY_FAIL: ${e.message}`);
        }
    }

    // --- UNDO: Revert the last applied fix ---
    async undo(cmd) {
        if (!this.lastFix || !this.lastFix.targetFile) {
            return this.updateStatus(cmd.id, 'failed', 'RALPH: No fix to undo.');
        }

        const backupPath = this.lastFix.targetFile + '.ralph-backup';
        try {
            if (!fs.existsSync(backupPath)) {
                return this.updateStatus(cmd.id, 'failed', 'RALPH: Backup file not found. Cannot undo.');
            }

            fs.copyFileSync(backupPath, this.lastFix.targetFile);
            fs.unlinkSync(backupPath);

            await this.updateStatus(cmd.id, 'executed',
                `↩️ RALPH UNDO: Reverted ${path.basename(this.lastFix.targetFile)} to previous state.`
            );

            this.lastFix = null;
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_UNDO_FAIL: ${e.message}`);
        }
    }

    // --- VISUAL SCAN: Full pipeline (audit → locate → fix) using vision model ---
    async visualScan(cmd, simulate = false) {
        await this.updateStatus(cmd.id, 'executing', `👁️ RALPH: ${simulate ? 'Simulating' : 'Executing'} Visual Audit...`);

        try {
            const result = await this.agent.fullScan(simulate);

            if (!result.success) {
                const step = result.step || 'init';
                let friendlyError = result.error || result.message;

                if (friendlyError.includes('Command timed out')) friendlyError = "Vision model timed out (is Ollama running?)";
                if (friendlyError.includes('fetch failed')) friendlyError = "Cannot reach Ollama (ensure it's running on port 11434)";

                return this.updateStatus(cmd.id, 'failed', `RALPH VISUAL_BLIND [${step}]: ${friendlyError}`);
            }

            if (result.step === 'audit' && result.message) {
                return this.updateStatus(cmd.id, 'executed', `✅ RALPH SCAN CLEAN: ${result.message}`);
            }

            // Store for apply
            if (result.fix && result.fix.fix) {
                const absPath = path.isAbsolute(result.targetFile)
                    ? result.targetFile
                    : path.join(__dirname, '..', '..', '..', result.targetFile);

                this.lastFix = { targetFile: absPath, fixData: result.fix.fix, source: result.fix.source };
                this.lastAudit = { analysis: result.audit, targetFile: absPath };
            }

            // Format comprehensive output
            const defects = result.audit.defects || [];
            const fixes = result.fix?.fix ? (Array.isArray(result.fix.fix) ? result.fix.fix : [result.fix.fix]) : [];

            let output = `🔄 RALPH VISUAL SCAN COMPLETE\n`;
            output += `━━━━━━━━━━━━━━━━━━━━━━\n`;
            output += `📊 Defects: ${defects.length}\n`;
            output += `📁 File: ${result.targetFile}\n`;
            output += `🧠 AI: ${result.fix?.source?.toUpperCase() || 'N/A'}\n\n`;

            output += `DEFECTS:\n`;
            defects.forEach((d, i) => { output += `${i + 1}. ${d}\n`; });

            if (fixes.length > 0) {
                output += `\nPROPOSED FIXES:\n`;
                fixes.forEach((f, i) => {
                    output += `${i + 1}. [${f.confidence || '?'}] ${f.explanation || 'No description'}\n`;
                });

                if (simulate) {
                    output += `\n🔬 SIMULATION STATUS: ${result.verified ? 'VALID' : 'INVALID'}\n`;
                    if (result.shadowPath) output += `📁 Shadow: ${path.basename(result.shadowPath)}\n`;
                    if (result.verified) output += `\n💡 Safe to apply. Say "proceed" or run "ralph:apply".`;
                } else {
                    output += `\n💡 Say "proceed" to execute repairs.`;
                }
            }

            await this.updateStatus(cmd.id, 'executed', output);

        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_SCAN_FAIL: ${e.message}`);
        }
    }

    async purgeShadows(cmd) {
        await this.updateStatus(cmd.id, 'executing', '🧹 RALPH: Purging shadow fragments...');
        try {
            await this.agent.cleanupShadows();
            await this.updateStatus(cmd.id, 'executed', '✅ RALPH: Shadow fragments purged from all applications.');
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_PURGE_FAIL: ${e.message}`);
        }
    }

    // --- SYSTEM SCAN: Real OS metrics (no AI hallucination) ---
    async systemScan(cmd) {
        await this.updateStatus(cmd.id, 'executing', '🖥️ RALPH: Scanning Matrix Environment...');

        try {
            const data = await this.agent.systemScan();
            let output = `🖥️ MATRIX SYSTEM DIAGNOSTICS\n`;

            // Health Header
            const health = data.health || {};
            const healthIcon = health.ollama === 'ONLINE' && health.database === 'CONNECTED' ? '✅' : '⚠️';
            output += `${healthIcon} STATUS: [AI: ${health.ollama || '?'}] [DB: ${health.database || '?'}] [ENV: ${health.matrix_env || '?'}]\n`;
            output += `━━━━━━━━━━━━━━━━━━━━━━\n`;

            // 1. Storage (Scoped)
            if (data.disks && data.disks.length > 0) {
                output += `💾 STORAGE (Matrix Drive):\n`;
                data.disks.forEach(d => {
                    const used = d.UsedGB || 0;
                    const total = d.TotalGB || 1;
                    const pct = Math.round((used / total) * 100);
                    const bar = this._progressBar(pct);
                    output += `${d.Name} [${bar}] ${pct}% (${d.FreeGB}GB Free)\n`;
                });
                output += `\n`;
            }

            // 2. Compute
            if (data.system) {
                const sys = data.system;
                const cpu = Math.round(sys.CPU_Percent || 0);
                const ramMap = Math.round(((sys.RAM_Used_GB || 0) / (sys.RAM_Total_GB || 1)) * 100);

                output += `⚡ COMPUTE:\n`;
                output += `CPU: [${this._progressBar(cpu)}] ${cpu}%\n`;
                output += `RAM: [${this._progressBar(ramMap)}] ${ramMap}% (${sys.RAM_Used_GB}/${sys.RAM_Total_GB} GB)\n\n`;
            }

            // 3. Project Stats
            if (data.project) {
                output += `📂 PROJECT MATRIX:\n`;
                output += `• Source Files: ${data.project.sourceFileCount}\n`;
                output += `• Apps Size: ${data.project.appsSizeMB} MB\n\n`;
            }

            // 4. Processes
            if (data.topProcesses && data.topProcesses.length > 0) {
                output += `📊 TOP PROCESSES (CPU/MEM):\n`;
                data.topProcesses.forEach(p => {
                    output += `• ${p.Name.padEnd(20)} | CPU: ${p.CPU}% | MEM: ${p.MemMB}MB\n`;
                });
            }

            await this.updateStatus(cmd.id, 'executed', output);

        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_SYSTEM_SCAN_FAIL: ${e.message}`);
        }
    }

    // ═══════════════════════════════════════
    // FILE MANIPULATION COMMANDS
    // ═══════════════════════════════════════

    _resolvePath(filePath) {
        const cleaned = filePath.trim().replace(/^["']|["']$/g, '');
        if (path.isAbsolute(cleaned)) return cleaned;
        return path.join(__dirname, '..', '..', '..', cleaned);
    }

    // --- READ FILE ---
    async fileRead(cmd) {
        const filePath = cmd.command.replace(/^ralph:read\s+/i, '').trim();
        const absPath = this._resolvePath(filePath);

        await this.updateStatus(cmd.id, 'executing', `📖 RALPH: Reading ${path.basename(absPath)}...`);

        try {
            if (!fs.existsSync(absPath)) {
                return this.updateStatus(cmd.id, 'failed', `RALPH: File not found: ${absPath}`);
            }

            const stat = fs.statSync(absPath);
            if (stat.size > 50000) {
                return this.updateStatus(cmd.id, 'failed', `RALPH: File too large (${Math.round(stat.size / 1024)}KB). Max 50KB for read.`);
            }

            const content = fs.readFileSync(absPath, 'utf8');
            const lines = content.split('\n');
            const preview = lines.slice(0, 100).join('\n');
            const truncated = lines.length > 100 ? `\n\n... (${lines.length - 100} more lines)` : '';

            await this.updateStatus(cmd.id, 'executed',
                `📖 RALPH FILE READ: ${path.basename(absPath)}\n` +
                `Size: ${Math.round(stat.size / 1024)}KB | Lines: ${lines.length}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n${preview}${truncated}`
            );
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_READ_FAIL: ${e.message}`);
        }
    }

    // --- WRITE FILE ---
    async fileWrite(cmd) {
        // Format: ralph:write <path> <content>
        const parts = cmd.command.replace(/^ralph:write\s+/i, '').trim();
        const firstSpace = parts.indexOf(' ');
        if (firstSpace === -1) {
            return this.updateStatus(cmd.id, 'failed', 'RALPH: Usage: write <path> <content>');
        }

        const filePath = parts.substring(0, firstSpace);
        const content = parts.substring(firstSpace + 1);
        const absPath = this._resolvePath(filePath);

        await this.updateStatus(cmd.id, 'executing', `✏️ RALPH: Writing to ${path.basename(absPath)}...`);

        try {
            // Backup if exists
            if (fs.existsSync(absPath)) {
                fs.copyFileSync(absPath, absPath + '.ralph-backup');
            }

            const dir = path.dirname(absPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(absPath, content, 'utf8');
            await this.updateStatus(cmd.id, 'executed',
                `✏️ RALPH WRITE: ${path.basename(absPath)} updated (${content.length} chars)`
            );
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_WRITE_FAIL: ${e.message}`);
        }
    }

    // --- RENAME FILE ---
    async fileRename(cmd) {
        // Format: ralph:rename <old> <new>
        const input = cmd.command.replace(/^ralph:rename\s+/i, '').trim();
        // Regex to split by space but keep quotes intact
        const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

        if (parts.length < 2) {
            return this.updateStatus(cmd.id, 'failed', 'RALPH: Usage: rename <oldPath> <newPath>');
        }

        // Remove quotes from captured parts
        const oldFile = parts[0].replace(/^["']|["']$/g, '');
        const newFile = parts[1].replace(/^["']|["']$/g, '');

        const oldPath = this._resolvePath(oldFile);
        const newPath = this._resolvePath(newFile);

        await this.updateStatus(cmd.id, 'executing', `🔄 RALPH: Renaming ${path.basename(oldPath)}...`);

        try {
            if (!fs.existsSync(oldPath)) {
                return this.updateStatus(cmd.id, 'failed', `RALPH: Source not found: ${oldPath}`);
            }
            fs.renameSync(oldPath, newPath);
            await this.updateStatus(cmd.id, 'executed',
                `🔄 RALPH RENAME: ${path.basename(oldPath)} → ${path.basename(newPath)}`
            );
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_RENAME_FAIL: ${e.message}`);
        }
    }

    // --- DELETE FILE ---
    async fileDelete(cmd) {
        const filePath = cmd.command.replace(/^ralph:delete\s+/i, '').trim();
        const absPath = this._resolvePath(filePath);

        await this.updateStatus(cmd.id, 'executing', `🗑️ RALPH: Deleting ${path.basename(absPath)}...`);

        try {
            if (!fs.existsSync(absPath)) {
                return this.updateStatus(cmd.id, 'failed', `RALPH: File not found: ${absPath}`);
            }

            // Backup before delete
            const backupDir = path.join(__dirname, '..', '..', '..', '.ralph-trash');
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
            const backupPath = path.join(backupDir, `${Date.now()}_${path.basename(absPath)}`);
            fs.copyFileSync(absPath, backupPath);

            fs.unlinkSync(absPath);
            await this.updateStatus(cmd.id, 'executed',
                `🗑️ RALPH DELETE: ${path.basename(absPath)} removed (backup: .ralph-trash/)`
            );
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_DELETE_FAIL: ${e.message}`);
        }
    }

    // --- LIST DIRECTORY ---
    async fileLs(cmd) {
        const dirPath = cmd.command.replace(/^ralph:ls\s*/i, '').trim() || '.';
        const absPath = this._resolvePath(dirPath);

        await this.updateStatus(cmd.id, 'executing', `📂 RALPH: Listing ${path.basename(absPath) || absPath}...`);

        try {
            if (!fs.existsSync(absPath)) {
                return this.updateStatus(cmd.id, 'failed', `RALPH: Directory not found: ${absPath}`);
            }

            const entries = fs.readdirSync(absPath, { withFileTypes: true });
            const dirs = entries.filter(e => e.isDirectory()).map(e => `📁 ${e.name}/`);
            const files = entries.filter(e => e.isFile()).map(e => {
                const stat = fs.statSync(path.join(absPath, e.name));
                const sizeKB = Math.round(stat.size / 1024);
                return `📄 ${e.name} (${sizeKB}KB)`;
            });

            let output = `📂 RALPH LS: ${absPath}\n`;
            output += `━━━━━━━━━━━━━━━━━━━━━━\n`;
            output += `Directories (${dirs.length}):\n${dirs.join('\n') || '  (none)'}\n\n`;
            output += `Files (${files.length}):\n${files.join('\n') || '  (none)'}`;

            await this.updateStatus(cmd.id, 'executed', output);
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_LS_FAIL: ${e.message}`);
        }
    }

    // --- MAKE DIRECTORY ---
    async fileMkdir(cmd) {
        const dirPath = cmd.command.replace(/^ralph:mkdir\s+/i, '').trim();
        const absPath = this._resolvePath(dirPath);

        await this.updateStatus(cmd.id, 'executing', `📁 RALPH: Creating directory ${path.basename(absPath)}...`);

        try {
            if (fs.existsSync(absPath)) {
                return this.updateStatus(cmd.id, 'executed', `RALPH: Directory already exists: ${absPath}`);
            }
            fs.mkdirSync(absPath, { recursive: true });
            await this.updateStatus(cmd.id, 'executed', `📁 RALPH MKDIR: ${absPath} created`);
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_MKDIR_FAIL: ${e.message}`);
        }
    }

    // --- LOCATE: Find files by text ---
    async locate(command, cmd) {
        const text = command.replace('ralph:locate ', '').trim();
        await this.updateStatus(cmd.id, 'executing', `RALPH: 🔎 Hunting for "${text}"...`);

        try {
            const files = await this.agent.locate(text);

            if (files.length === 0) {
                await this.updateStatus(cmd.id, 'executed', 'RALPH: No matching files found.');
            } else {
                let output = `📁 RALPH LOCATED ${files.length} file(s):\n`;
                output += files.map((f, i) => `${i + 1}. ${f}`).join('\n');
                await this.updateStatus(cmd.id, 'executed', output);
            }
        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_LOCATE_FAIL: ${e.message}`);
        }
    }

    async chat(cmd, query) {
        await this.updateStatus(cmd.id, 'executing', 'Analyzing...');

        const { config } = this.context.agent.context;
        const model = config.ollama.chatModel || 'llama3.2:latest';

        try {
            const prompt = `You are Ralph, the Matrix System Auditor and Code Repairman.
            
            CRITICAL RULES:
            - NEVER introduce yourself. NO "I am Ralph", NO "Greetings", NO "Hello", NO "As a specialized AI".
            - BEGIN your response immediately with the pertinent information. 
            - DO NOT use any introductory phrases or polite fillers.
            - STAY in character as an integrated system component.
            
            TONE: Professional, insightful, proactive, and "organic". 
            
            USER QUERY: ${query}`;

            const response = await fetch(`${config.ollama.url}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                })
            });

            if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);

            const data = await response.json();
            const reply = data.message.content;

            await this.updateStatus(cmd.id, 'executed', reply);

            // NEURAL VOICE INTEGRATION
            try { Voice.speak(reply); } catch (e) { console.error('[VOICE] Failed:', e.message); }

        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_CHAT_FAIL: ${e.message}`);
        }
    }

    // --- NETWORK SCAN: Check system ports ---
    async scanNetwork(cmd) {
        await this.updateStatus(cmd.id, 'executing', '📡 RALPH: Pinging neural pathways...');
        const net = require('net');
        const ports = [
            { port: 3000, service: 'REFLECT' },
            { port: 3001, service: 'MATRIX_HUB' },
            { port: 5173, service: 'GHOST_CMD' },
            { port: 5432, service: 'SUPABASE_DB' } // Postgres usually
        ];

        const results = [];

        for (const target of ports) {
            const isOpen = await new Promise(resolve => {
                const s = new net.Socket();
                s.setTimeout(2000);
                s.connect(target.port, '127.0.0.1', () => {
                    s.destroy();
                    resolve(true);
                });
                s.on('error', () => { s.destroy(); resolve(false); });
                s.on('timeout', () => { s.destroy(); resolve(false); });
            });
            results.push({ ...target, status: isOpen ? 'ONLINE' : 'OFFLINE' });
        }

        let output = `📡 RALPH NETWORK SCAN\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        results.forEach(r => {
            const icon = r.status === 'ONLINE' ? '✅' : '🔴';
            output += `${icon} ${r.service} (:${r.port}) → ${r.status}\n`;
        });

        await this.updateStatus(cmd.id, 'executed', output);
    }

    // --- DOWNLOAD FILE (Media/Web) ---
    async fileDownload(cmd) {
        const url = cmd.command.replace(/^ralph:download\s+/i, '').trim();
        if (!url) return this.updateStatus(cmd.id, 'failed', 'RALPH: Usage: ralph:download <url>');

        const downloadsDir = path.join(__dirname, '..', '..', '..', '..', 'downloads');
        if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

        const binPath = path.join(__dirname, '..', '..', '..', '..', 'core', 'bin', 'yt-dlp.exe');
        if (!fs.existsSync(binPath)) {
            return this.updateStatus(cmd.id, 'failed', 'RALPH: yt-dlp binary missing in core/bin.');
        }

        await this.updateStatus(cmd.id, 'executing', `⬇️ RALPH: Downloading media from ${url}...`);

        const { exec } = require('child_process');
        // Use yt-dlp to download to downloads folder
        const command = `"${binPath}" -o "${downloadsDir}/%(title)s.%(ext)s" "${url}"`;

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                await this.updateStatus(cmd.id, 'failed', `RALPH_DOWNLOAD_FAIL: ${stderr || error.message}`);
            } else {
                // Find what was downloaded (parse stdout or just list latest)
                const filenameMatch = stdout.match(/Destination: (.*)/) || stdout.match(/Merging formats into "(.*)"/);
                const filename = filenameMatch ? path.basename(filenameMatch[1]) : 'Unknown file';

                await this.updateStatus(cmd.id, 'executed',
                    `✅ RALPH DOWNLOAD COMPLETE\n` +
                    `📁 Saved to: downloads/${filename}\n` +
                    `🔗 Source: ${url}`
                );
            }
        });
    }

    // --- EXEC: Run Shell Command ---
    async exec(cmd) {
        const shellCmd = cmd.command.replace(/^ralph:exec\s+/i, '').trim();
        if (!shellCmd) return this.updateStatus(cmd.id, 'failed', 'RALPH: Usage: ralph:exec <command>');

        await this.updateStatus(cmd.id, 'executing', `⚙️ RALPH: Executing "${shellCmd}"...`);

        const { exec } = require('child_process');

        return new Promise((resolve, reject) => {
            exec(shellCmd, { cwd: path.join(__dirname, '..', '..', '..') }, async (error, stdout, stderr) => {
                if (error) {
                    const errorMsg = stderr || error.message;
                    await this.updateStatus(cmd.id, 'failed', `RALPH_EXEC_FAIL: ${errorMsg}`);
                    reject(new Error(errorMsg)); // Trigger catch in RalphLoop
                } else {
                    const output = stdout.trim() || stderr.trim() || 'Command executed successfully.';
                    await this.updateStatus(cmd.id, 'executed',
                        `⚙️ RALPH EXEC COMPLETE\n` +
                        `Command: ${shellCmd}\n` +
                        `Output:\n${output.substring(0, 1000)}${output.length > 1000 ? '...' : ''}`
                    );
                    resolve(output);
                }
            });
        });
    }

    // --- OPTIMIZE DB: Cleanup routines ---
    async optimizeDb(cmd) {
        await this.updateStatus(cmd.id, 'executing', '🧹 RALPH: Initiating database purification...');

        try {
            // 1. Purge old missions
            const { count: missionCount, error: missionError } = await this.supabase
                .from('matrix_missions')
                .delete({ count: 'exact' })
                .eq('status', 'completed')
                .lt('created_at', new Date(Date.now() - 86400000).toISOString()); // Older than 24h

            // 2. Clear old ghost_bridge logs
            const { count: bridgeCount, error: bridgeError } = await this.supabase
                .from('ghost_bridge')
                .delete({ count: 'exact' })
                .in('status', ['executed', 'failed'])
                .lt('created_at', new Date(Date.now() - 3600000).toISOString()); // Older than 1h

            if (missionError) throw missionError;
            if (bridgeError) throw bridgeError;

            await this.updateStatus(cmd.id, 'executed',
                `✨ RALPH PURIFICATION COMPLETE\n` +
                `• Archived Missions Cleared: ${missionCount || 0}\n` +
                `• Bridge Logs Scrubbed: ${bridgeCount || 0}\n` +
                `System entropy reduced.`
            );

        } catch (e) {
            await this.updateStatus(cmd.id, 'failed', `RALPH_OPTIMIZE_FAIL: ${e.message}`);
        }
    }

    async updateStatus(id, status, output) {
        try {
            await this.supabase.from('ghost_bridge').update({ status, output }).eq('id', id);
        } catch (e) {
            console.warn(`[RALPH] updateStatus failed for ${id}: ${e.message}`);
        }
    }
}

module.exports = RalphHandler;
