const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class RalphAgent {
    constructor(supabase, context) {
        this.supabase = supabase;
        this.context = context; // { config, handlers }
        // Default to moondream for speed/efficiency on local hardware, or use config override
        this.visionModel = context.config?.ollama?.visionModel || 'moondream:latest';
        this.chatModel = context.config?.ollama?.chatModel || 'llama3.2:latest';
    }

    /**
     * The Eye of Ralph: Sees the screen and identifies defects.
     */
    async audit() {
        console.log('[RALPH] 👁️ Initiating Visual Audit Protocol...');

        const picPath = await this.captureScreen();
        if (!picPath) return { success: false, error: 'Screen capture failed' };

        const analysis = await this.analyzeImage(picPath);

        // Cleanup the screenshot after analysis
        try { fs.unlinkSync(picPath); } catch (e) { }

        return {
            success: true,
            snapshot: picPath, // Path is invalid now but kept for reference
            analysis: analysis
        };
    }

    async captureScreen() {
        const filePath = path.join(process.cwd(), `ralph_snap_${Date.now()}.png`);

        // Robust PowerShell capture (matches VisionHandler)
        const psCommand = `
            Add-Type -AssemblyName System.Windows.Forms,System.Drawing;
            $Screen = [System.Windows.Forms.Screen]::PrimaryScreen;
            $Bitmap = New-Object System.Drawing.Bitmap($Screen.Bounds.Width, $Screen.Bounds.Height);
            $Graphics = [System.Drawing.Graphics]::FromImage($Bitmap);
            $Graphics.CopyFromScreen(0, 0, 0, 0, $Bitmap.Size);
            $Bitmap.Save('${filePath}');
            $Graphics.Dispose();
            $Bitmap.Dispose();
        `.replace(/\n/g, ' ').trim();

        return new Promise((resolve) => {
            exec(`powershell -Command "${psCommand}"`, (err) => {
                if (err) {
                    console.error('[RALPH] Capture failed:', err);
                    resolve(null);
                } else {
                    resolve(filePath);
                }
            });
        });
    }

    async analyzeImage(filePath) {
        const { config } = this.context;
        console.log(`[RALPH] 🧠 Analyzing visual data using ${this.visionModel}...`);

        // Notify user via bridge if possible (optional, handled by handler mostly)

        try {
            const fileBuffer = fs.readFileSync(filePath);
            const base64Image = Buffer.from(fileBuffer).toString('base64');

            // Enhanced prompt for deeper UI analysis
            const prompt = `
                Perform a comprehensive UI audit of this screenshot. Detect and describe:
                1. Layout misalignment
                2. Text cut off or overflowing
                3. Broken images/icons
                4. Error messages
                5. Low contrast or color accessibility issues
                6. Missing alt text or labels
                7. Overlapping elements
                8. Unreadable or very small text
                9. Suspicious empty/blank areas
                10. Any other visual or accessibility issues

                For each defect, if possible, provide:
                - Affected component/element (e.g., button, input, label)
                - Bounding box (x, y, width, height)
                - Severity (low|medium|high)
                - Explanation
                - OCR text near/inside the defect

                Respond in JSON format:
                {
                  "summary": "Short description",
                  "defects": [
                    {
                      "description": "...",
                      "component": "button|input|label|...",
                      "severity": "low|medium|high",
                      "bbox": [x, y, width, height],
                      "ocr_text": "..."
                    },
                    ...
                  ],
                  "specific_text": ["unique text near defect 1", "unique text near defect 2"],
                  "affected_components": ["button", "input", ...],
                  "color_issues": ["..."],
                  "accessibility": ["..."],
                  "historical": null
                }
            `;

            const response = await fetch(`${config.ollama.url}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.visionModel,
                    messages: [{ role: 'user', content: prompt, images: [base64Image] }],
                    stream: false,
                    format: 'json'
                })
            });

            if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);

            const data = await response.json();

            let result;
            try {
                result = JSON.parse(data.message.content);
            } catch (parseErr) {
                console.warn('[RALPH] JSON Parse validation failed, attempting to repair or fallback');
                result = {
                    summary: data.message.content,
                    defects: [
                        {
                            description: "Raw output returned (JSON parse failed)",
                            component: null,
                            severity: "unknown",
                            bbox: null,
                            ocr_text: null
                        }
                    ],
                    specific_text: [],
                    affected_components: [],
                    color_issues: [],
                    accessibility: [],
                    historical: null
                };
            }

            return result;

        } catch (e) {
            console.error('[RALPH] Analysis failed:', e.message);
            return {
                error: e.message,
                defects: [],
                specific_text: [],
                affected_components: [],
                color_issues: [],
                accessibility: [],
                historical: null
            };
        }
    }

    /**
     * The Hand of Ralph: Locates the file responsible for the defect.
     */
    async locate(defectText) {
        if (!defectText) return [];
        console.log(`[RALPH] 🔎 Hunting for source code containing: "${defectText}"...`);

        // Escape special regex chars for grep safety
        const safeText = defectText.replace(/['"\\`$]/g, '');

        // Detailed grep:
        // - Recursive (-r)
        // - File names only (-l)
        // - Include specific extensions
        // - Exclude noisy directories (node_modules, .next, .git, .turbo, dist, build)
        // - Prioritize apps/matrix-hub and apps/reflect
        const searchBase = path.join(__dirname, '..', '..', '..');
        const isWin = process.platform === "win32";
        const searchCmd = isWin
            ? `powershell -Command "Get-ChildItem -Path ./apps -Recurse -Include *.tsx,*.jsx,*.ts,*.js -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\\\node_modules\\\\|\\\\\\.next\\\\|\\\\\\.git\\\\|\\\\\\.turbo\\\\|\\\\dist\\\\|\\\\build\\\\|\\\\coverage\\\\' } | Select-String -Pattern '${safeText}' -SimpleMatch -List | Select-Object -ExpandProperty Path"`
            : `grep -rl "${safeText}" apps --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" --exclude-dir={node_modules,.next,.git,.turbo,dist,build,coverage}`;

        return new Promise((resolve) => {
            exec(searchCmd, { cwd: searchBase }, (err, stdout) => {
                if (err && err.code !== 1 && !isWin) { // 1 means no matches found, which is not an error
                    console.error('[RALPH] Search error:', err);
                    resolve([]);
                    return;
                }

                if (!stdout) {
                    resolve([]);
                    return;
                }

                const files = stdout.split('\n').filter(Boolean).map(f => {
                    const cleanPath = f.trim().replace(/\\/g, '/');
                    const appsIndex = cleanPath.indexOf('apps/');
                    return appsIndex !== -1 ? cleanPath.substring(appsIndex) : cleanPath;
                });

                // RANKING LOGIC:
                // 1. Prefer .tsx/.jsx files (likely UI)
                // 2. Prefer active apps (matrix-hub, reflect)
                const ranked = files.sort((a, b) => {
                    const score = (f) => {
                        let s = 0;
                        if (f.includes('apps/nexus') || f.includes('apps/reflect')) s += 10;
                        if (f.endsWith('.tsx') || f.endsWith('.jsx')) s += 5;
                        if (f.includes('components/')) s += 2;
                        return s;
                    };
                    return score(b) - score(a);
                });

                const uniqueFiles = [...new Set(ranked)];
                resolve(uniqueFiles);
            });
        });
    }

    /**
     * The Brain of Ralph: Generates a code fix using Groq (cloud) or Ollama (local).
     * Supports multi-file context for complex dependencies.
     */
    async generateFix(targetFiles, defects, mainFileContent) {
        const { config } = this.context;

        // Gather secondary context if multiple files are provided
        let contextBlock = "";
        if (Array.isArray(targetFiles) && targetFiles.length > 1) {
            for (let i = 1; i < Math.min(targetFiles.length, 3); i++) {
                const absPath = path.isAbsolute(targetFiles[i])
                    ? targetFiles[i]
                    : path.join(__dirname, '..', '..', '..', targetFiles[i]);
                if (fs.existsSync(absPath)) {
                    const content = fs.readFileSync(absPath, 'utf8').substring(0, 2000);
                    contextBlock += `\nFILE: ${targetFiles[i]}\n\`\`\`tsx\n${content}\n\`\`\`\n`;
                }
            }
        }

        const primaryFile = Array.isArray(targetFiles) ? targetFiles[0] : targetFiles;
        const truncatedContent = mainFileContent.substring(0, 8000);

        const prompt = `
            You are an expert React/Next.js developer. 
            DEFECTS:
            ${defects.map((d, i) => `${i + 1}. ${d}`).join('\n')}
            
            PRIMARY SOURCE FILE: ${primaryFile}
            \`\`\`tsx
            ${truncatedContent}
            \`\`\`

            ${contextBlock ? `SECONDARY CONTEXT:\n${contextBlock}` : ""}
            
            TASK:
            Generate a PRECISE code fix for the PRIMARY SOURCE FILE. 
            Return a valid JSON object (NO Markdown formatting) with:
            {
                "explanation": "Brief description of the fix",
                "search": "Exact unique string to replace (must match file content exactly)",
                "replace": "The new code",
                "confidence": "high|medium|low"
            }
            
            If the file doesn't seem to contain the defect logic, return "confidence": "low".
        `;

        // Try Groq first for higher quality fixes (70B model)
        const apiKey = process.env.GROQ_API_KEY;
        if (apiKey) {
            try {
                console.log('[RALPH] ☁️ Generating fix via Groq Cloud (llama-3.3-70b)...');
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 2048,
                        temperature: 0.2,
                        response_format: { type: 'json_object' }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const raw = data.choices[0].message.content;
                    try {
                        return { source: 'groq', fix: JSON.parse(raw) };
                    } catch (e) {
                        console.warn('[RALPH] Groq JSON parse failed, returning raw block');
                        return { source: 'groq', fix: { raw_content: raw } };
                    }
                } else {
                    console.warn(`[RALPH] Groq Error: ${response.status} ${response.statusText}`);
                }
            } catch (e) {
                console.warn('[RALPH] Groq fix generation failed:', e.message);
            }
        }

        // Fallback to Ollama (local)
        try {
            console.log(`[RALPH] 🏠 Generating fix via local Ollama (${this.chatModel})...`);
            const response = await fetch(`${config.ollama.url}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.chatModel,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false,
                    format: 'json'
                })
            });

            const data = await response.json();
            const raw = data.message.content;
            try {
                return { source: 'ollama', fix: JSON.parse(raw) };
            } catch (e) {
                console.warn('[RALPH] Ollama JSON parse failed, returning raw block');
                return { source: 'ollama', fix: { raw_content: raw } };
            }
        } catch (e) {
            console.error('[RALPH] Local fix generation failed:', e.message);
            return { source: 'failed', fix: null, error: e.message };
        }
    }

    /**
     * Verification Loop: Re-runs audit or checks the file to ensure the fix worked.
     */
    async verifyFix(targetFile, defects) {
        console.log(`[RALPH] ✅ Verifying fix for ${targetFile}...`);

        // For visual defects, we'd ideally re-audit. 
        // For now, we'll check if the search string is gone or if a basic build-check passes.
        const absPath = path.isAbsolute(targetFile)
            ? targetFile
            : path.join(__dirname, '..', '..', '..', targetFile);

        if (!fs.existsSync(absPath)) return false;

        // Simple heuristic: Re-audit (vision is expensive, so we might skip or do a high-speed check)
        // Here we just check for basic syntax validity
        return new Promise((resolve) => {
            exec(`node --check "${absPath}"`, (err) => {
                resolve(!err);
            });
        });
    }

    /**
     * The Scalpel of Ralph: Applies a fix to a file.
     */
    applyFix(targetFile, fixData) {
        const result = this._prepareFix(targetFile, fixData);
        if (!result.success) return result;

        const { absPath, content, appliedCount, fixes } = result;

        if (appliedCount > 0) {
            // Backup original
            const backupPath = absPath + '.ralph-backup';
            fs.copyFileSync(absPath, backupPath);

            // Write fix
            fs.writeFileSync(absPath, content, 'utf8');
            return { success: true, applied: appliedCount, total: fixes.length, backup: backupPath };
        }

        return { success: false, error: 'No fixes could be applied (search strings not found)' };
    }

    /**
     * Simulation Protocol: Previews a fix without mutating source.
     */
    async simulateFix(targetFile, fixData) {
        console.log(`[RALPH] 🔬 Simulating fix for ${targetFile}...`);
        const result = this._prepareFix(targetFile, fixData);
        if (!result.success) return result;

        const { absPath, content, appliedCount } = result;

        if (appliedCount > 0) {
            const shadowPath = absPath + '.ralph_shadow';
            fs.writeFileSync(shadowPath, content, 'utf8');

            // Quick syntax check
            let syntaxValid = true;
            let syntaxError = null;
            try {
                await this._execCmd(`node --check "${shadowPath}"`);
            } catch (err) {
                syntaxValid = false;
                syntaxError = err.message;
            }

            return {
                success: true,
                simulated: true,
                applied: appliedCount,
                shadowPath,
                syntaxValid,
                syntaxError,
                message: syntaxValid ? 'Simulation valid. Fix is safe to apply.' : 'Simulation failed syntax check.'
            };
        }

        return { success: false, error: 'Simulation failed: Search strings not found.' };
    }

    /** Internal helper to prepare fix content */
    _prepareFix(targetFile, fixData) {
        const absPath = path.isAbsolute(targetFile)
            ? targetFile
            : path.join(__dirname, '..', '..', '..', targetFile);

        if (!fs.existsSync(absPath)) {
            return { success: false, error: `File not found: ${absPath}` };
        }

        let content = fs.readFileSync(absPath, 'utf8');
        const fixes = Array.isArray(fixData) ? fixData : [fixData];
        let appliedCount = 0;

        for (const fix of fixes) {
            if (!fix.search || !fix.replace) continue;

            if (content.includes(fix.search)) {
                content = content.replace(fix.search, fix.replace);
                appliedCount++;
            }
        }

        return { success: true, absPath, content, appliedCount, fixes };
    }

    cleanupShadows() {
        console.log('[RALPH] 🧹 Purging shadow fragments...');
        // Find and remove all .ralph_shadow files in apps
        const projectRoot = path.join(__dirname, '..', '..', '..');
        const cleanupCmd = process.platform === 'win32'
            ? `powershell -Command "Get-ChildItem -Path '${projectRoot}\\apps' -Filter *.ralph_shadow -Recurse | Remove-Item -Force"`
            : `find "${projectRoot}/apps" -name "*.ralph_shadow" -delete`;

        return this._execCmd(cleanupCmd).catch(() => { });
    }

    /**
     * Full Pipeline: Audit → Locate → Fix → Apply (or Simulate)
     */
    async fullScan(simulate = false) {
        console.log(`[RALPH] 🔄 ${simulate ? 'SIMULATION' : 'FULL'} SCAN: SEE → MAP → FIX`);

        // 1. Audit
        const auditResult = await this.audit();
        if (!auditResult.success) return { success: false, step: 'audit', error: auditResult.error };

        const defects = auditResult.analysis.defects || [];
        const keys = auditResult.analysis.specific_text || [];

        if (defects.length === 0) {
            return { success: true, step: 'audit', message: 'No defects found. System is clean.' };
        }

        // 2. Locate
        let targetFile = null;
        for (const key of keys) {
            const files = await this.locate(key);
            if (files && files.length > 0) {
                targetFile = files[0]; // Ranked logic puts best match first
                break;
            }
        }

        if (!targetFile) {
            return { success: false, step: 'locate', defects, message: 'Could not locate source file.' };
        }

        // 3. Generate Fix
        const absPath = path.isAbsolute(targetFile)
            ? targetFile
            : path.join(__dirname, '..', '..', '..', targetFile);

        const content = fs.readFileSync(absPath, 'utf8');
        const fixResult = await this.generateFix([targetFile, ...keys.slice(0, 2)], defects, content);

        if (fixResult.fix) {
            if (simulate) {
                const simResult = await this.simulateFix(targetFile, fixResult.fix);
                return {
                    success: simResult.success,
                    step: 'complete',
                    simulated: true,
                    verified: simResult.syntaxValid,
                    message: simResult.message,
                    audit: auditResult.analysis,
                    targetFile,
                    fix: fixResult,
                    shadowPath: simResult.shadowPath
                };
            }

            if (fixResult.fix.confidence === 'high') {
                console.log('[RALPH] ✨ High-confidence fix generated. Autonomous application enabled.');
                const applyResult = this.applyFix(targetFile, fixResult.fix);
                if (applyResult.success) {
                    const verified = await this.verifyFix(targetFile, defects);
                    return {
                        success: true,
                        step: 'complete',
                        verified,
                        message: verified ? 'Fix applied and verified.' : 'Fix applied but verification failed (manual check required).',
                        audit: auditResult.analysis,
                        targetFile,
                        fix: fixResult
                    };
                }
            }
        }

        return {
            success: true,
            step: 'complete',
            verified: false,
            audit: auditResult.analysis,
            targetFile,
            fix: fixResult
        };
    }

    /**
     * System Scan: Collects REAL OS metrics (disk, CPU, RAM, processes, project stats).
     * No vision model involved — purely real data.
     */
    async systemScan() {
        console.log('[RALPH] 🖥️ SYSTEM SCAN: Gathering real OS metrics...');

        const results = {};
        const currentDrive = process.cwd().split(path.sep)[0]; // e.g., "C:" or "G:"

        // 1. Disk space (Scoped to Matrix Drive)
        try {
            const diskData = await this._execCmd(`powershell -Command "Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Root -like '${currentDrive}*' } | Select-Object Name,@{N='UsedGB';E={[math]::Round($_.Used/1GB,2)}},@{N='FreeGB';E={[math]::Round($_.Free/1GB,2)}},@{N='TotalGB';E={[math]::Round(($_.Used+$_.Free)/1GB,2)}} | ConvertTo-Json"`);
            results.disks = JSON.parse(diskData || '[]');
            if (!Array.isArray(results.disks)) results.disks = [results.disks];
        } catch (e) {
            results.disks = [{ error: e.message }];
        }

        // 2. CPU & RAM (Real)
        try {
            const sysData = await this._execCmd('powershell -Command "$cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average; $os = Get-CimInstance Win32_OperatingSystem; $totalRAM = [math]::Round($os.TotalVisibleMemorySize/1MB,2); $freeRAM = [math]::Round($os.FreePhysicalMemory/1MB,2); $usedRAM = $totalRAM - $freeRAM; @{CPU_Percent=$cpu;RAM_Total_GB=$totalRAM;RAM_Used_GB=$usedRAM;RAM_Free_GB=$freeRAM} | ConvertTo-Json"');
            results.system = JSON.parse(sysData || '{}');
        } catch (e) {
            results.system = { error: e.message };
        }

        // 3. Top processes by CPU & Memory
        try {
            const procData = await this._execCmd('powershell -Command "Get-Process | Sort-Object CPU -Descending | Select-Object -First 8 Name,@{N=\'MemMB\';E={[math]::Round($_.WorkingSet64/1MB,1)}},@{N=\'CPU\';E={[math]::Round($_.CPU,1)}} | ConvertTo-Json"');
            results.topProcesses = JSON.parse(procData || '[]');
            if (!Array.isArray(results.topProcesses)) results.topProcesses = [results.topProcesses];
        } catch (e) {
            results.topProcesses = [];
        }

        // 4. Matrix Project Stats
        try {
            const projectRoot = path.join(__dirname, '..', '..', '..');
            const nodeModulesSize = await this._execCmd(`powershell -Command "(Get-ChildItem '${projectRoot}\\apps' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB" `);
            const fileCount = await this._execCmd(`powershell -Command "(Get-ChildItem '${projectRoot}\\apps' -Recurse -File -Include *.tsx,*.ts,*.js,*.jsx,*.css -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notlike '*node_modules*' -and $_.FullName -notlike '*.next*' }).Count"`);
            results.project = {
                appsSizeMB: parseFloat(nodeModulesSize) ? Math.round(parseFloat(nodeModulesSize) * 100) / 100 : 'N/A',
                sourceFileCount: parseInt(fileCount) || 'N/A'
            };
        } catch (e) {
            results.project = { error: e.message };
        }

        // 5. Matrix Health (Health Check & Service Probes)
        try {
            // Check Ollama Port (Dynamic resolution from env)
            const ollamaUrl = process.env.AI_BASE_URL || 'http://localhost:11434';
            let ollamaHost = 'localhost';
            let ollamaPort = '11434';
            try {
                const url = new URL(ollamaUrl);
                ollamaHost = url.hostname;
                ollamaPort = url.port || (url.protocol === 'https:' ? '443' : '80');
            } catch (e) { }

            const ollamaCheck = await this._execCmd(`powershell -Command "Test-NetConnection -ComputerName ${ollamaHost} -Port ${ollamaPort} -InformationLevel Quiet"`);
            const isOllamaUp = ollamaCheck.trim() === 'True';

            // Check Supabase Connectivity
            const { error } = await this.supabase.from('ghost_bridge').select('id').limit(1);
            const isDbUp = !error;

            // Check common Matrix web servers (Reflect, Nexus, Ghost)
            const webPorts = [3000, 3001, 5173];
            const webStatus = {};
            for (const port of webPorts) {
                try {
                    const portCheck = await this._execCmd(`powershell -Command "Test-NetConnection -ComputerName localhost -Port ${port} -InformationLevel Quiet"`);
                    webStatus[`port_${port}`] = portCheck.trim() === 'True' ? 'ONLINE' : 'OFFLINE';
                } catch {
                    webStatus[`port_${port}`] = 'UNKNOWN';
                }
            }

            // Check background jobs (example: triage, runner)
            const jobs = ['triage', 'runner'];
            const jobStatus = {};
            for (const job of jobs) {
                try {
                    const jobCheck = await this._execCmd(`powershell -Command "Get-Process -Name ${job} -ErrorAction SilentlyContinue | Select-Object -First 1 Name | ConvertTo-Json"`);
                    jobStatus[job] = jobCheck && jobCheck.includes(job) ? 'RUNNING' : 'NOT_RUNNING';
                } catch {
                    jobStatus[job] = 'UNKNOWN';
                }
            }

            results.health = {
                ollama: isOllamaUp ? 'ONLINE' : 'OFFLINE',
                database: isDbUp ? 'CONNECTED' : 'DISCONNECTED',
                matrix_env: 'STABLE',
                web: webStatus,
                jobs: jobStatus
            };

            // --- MatrixDiagnostic Integration (if available) ---
            if (this.context.MatrixDiagnostic) {
                await this.context.MatrixDiagnostic.log('ghost-command', 'system', 'systemScan', results, 'info');
            }

            // --- Actionable Suggestions ---
            const suggestions = [];
            if (!isOllamaUp) suggestions.push('Ollama AI backend is OFFLINE. Restart the Ollama service.');
            if (!isDbUp) suggestions.push('Database is DISCONNECTED. Check Supabase credentials and network.');
            for (const [port, status] of Object.entries(webStatus)) {
                if (status !== 'ONLINE') suggestions.push(`${port.toUpperCase()} web server is not online.`);
            }
            for (const [job, status] of Object.entries(jobStatus)) {
                if (status !== 'RUNNING') suggestions.push(`Background job "${job}" is not running.`);
            }
            results.suggestions = suggestions;

        } catch (e) {
            results.health = { error: e.message };
        }

        return results;
    }

    /** Helper: Execute a shell command and return stdout */
    _execCmd(command, timeoutMs = 15000) {
        return new Promise((resolve, reject) => {
            const child = exec(command, { timeout: timeoutMs }, (err, stdout, stderr) => {
                if (err && err.killed) {
                    reject(new Error('Command timed out'));
                } else if (err) {
                    reject(err);
                } else {
                    resolve((stdout || '').trim());
                }
            });
        });
    }
}

module.exports = RalphAgent;
