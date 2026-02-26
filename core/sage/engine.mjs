/**
 * SAGE ENGINE (Matrix Core AI)
 * Centralized Intelligence Provider for Reflect, Nexus, and Ralph.
 * 
 * v3.0 — Added SageEnvironment for zero-cost local checks
 * 
 * Usage:
 * import { Sage, SageEnvironment } from './engine.mjs';
 * const sage = new Sage();
 * const env = new SageEnvironment();
 * const response = await sage.chat([{ role: 'user', content: 'Hello' }]);
 * const health = await env.fullCheck();
 */

import http from 'http';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = util.promisify(exec);

const CONFIG = {
    baseUrl: process.env.AI_BASE_URL || 'http://localhost:11434/v1',
    apiKey: process.env.AI_API_KEY || 'ollama',
    model: process.env.AI_MODEL || 'llama3.2:latest',
    temperature: 0.7
};

export class Sage {
    constructor(config = {}) {
        this.config = { ...CONFIG, ...config };
    }

    async chat(messages, options = {}) {
        const payload = {
            model: this.config.model,
            messages: messages,
            temperature: options.temperature || this.config.temperature,
            stream: false,
            ...options
        };

        try {
            const response = await this._post('/chat/completions', payload);
            return response.choices[0].message.content;
        } catch (error) {
            console.error('[SAGE] Chat Error:', error.message);
            throw error;
        }
    }

    async json(messages, schema = null, options = {}) {
        const payload = {
            model: this.config.model,
            messages: messages,
            format: 'json',
            temperature: options.temperature || 0.3, // Lower temp for JSON
            stream: false,
            ...options
        };

        try {
            const response = await this._post('/chat/completions', payload);
            let content = response.choices[0].message.content;

            // Sanitization: Fix common Windows path backslash issues
            // This is a naive heuristic but helps with "C:\Path" -> "C:\\Path"
            // We only trigger this if initial parse fails, but let's try to be smart.

            try {
                return JSON.parse(content);
            } catch (e1) {
                console.warn('[SAGE] JSON Parse Warning, attempting repair:', e1.message);
                // 1. Try to escape single backslashes that aren't already escaped or part of a valid escape sequence
                // This is hard to do perfectly with regex, so we'll try a simpler approach:
                // Replace single backslashes with double, except for known escapes \n \r \t \" \\
                // content = content.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

                // Better: Just use a lenient parser or ask LLM again (expensive). 
                // Let's try a replacement hack for common windows paths
                const fixed = content.replace(/([a-zA-Z]):\\/g, '$1:\\\\').replace(/\\/g, '/'); // Force forward slashes?
                try {
                    return JSON.parse(fixed);
                } catch (e2) {
                    // Last ditch: Extract first {...} block
                    const match = content.match(/\{[\s\S]*\}/);
                    if (match) return JSON.parse(match[0]);
                    throw e1;
                }
            }
        } catch (error) {
            console.error('[SAGE] JSON Error:', error.message);
            throw error; // Re-throw to let Ralph handle it
        }
    }

    async embed(text) {
        try {
            const response = await this._post('/embeddings', {
                model: 'nomic-embed-text', // Standard embedding model
                input: text
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('[SAGE] Embed Error:', error.message);
            return [];
        }
    }

    async _post(endpoint, data) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.config.baseUrl + endpoint);
            const body = JSON.stringify(data);

            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const req = http.request(options, (res) => {
                let chunks = [];
                res.on('data', (d) => chunks.push(d));
                res.on('end', () => {
                    const raw = Buffer.concat(chunks).toString();
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(raw));
                        } catch (e) {
                            reject(new Error(`Invalid JSON response: ${raw.substring(0, 100)}`));
                        }
                    } else {
                        reject(new Error(`API Error ${res.statusCode}: ${raw}`));
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(body);
            req.end();
        });
    }
}

/**
 * SAGE ENVIRONMENT — Zero-cost local environment checks
 * No API credits spent. Pure Node.js checks for:
 * - Port availability
 * - Dependency status
 * - Log scanning
 * - Build verification
 * - Process health
 */
export class SageEnvironment {
    constructor(matrixRoot = 'g:\\matrix') {
        this.root = matrixRoot;
        this.apps = [
            { name: 'Reflect', port: 3000, dir: 'apps/reflect' },
            { name: 'Nexus', port: 3001, dir: 'apps/nexus' },
            { name: 'Ghost Command', port: 5173, dir: 'apps/ghost-command' },
            { name: 'RocketCommand', port: 4000, dir: 'apps/rocket-command' },
        ];
    }

    /**
     * Check if a port is in use (service running)
     */
    async checkPort(port) {
        return new Promise(resolve => {
            const req = http.request({ hostname: 'localhost', port, path: '/', method: 'HEAD', timeout: 2000 }, (res) => {
                resolve({ port, status: 'up', code: res.statusCode });
            });
            req.on('error', () => resolve({ port, status: 'down', code: null }));
            req.on('timeout', () => { req.destroy(); resolve({ port, status: 'timeout', code: null }); });
            req.end();
        });
    }

    /**
     * Check all Matrix app ports
     */
    async checkAllPorts() {
        const results = {};
        for (const app of this.apps) {
            results[app.name] = await this.checkPort(app.port);
        }
        return results;
    }

    /**
     * Check if node_modules exists for an app
     */
    checkDeps(appDir) {
        const nmPath = path.join(this.root, appDir, 'node_modules');
        const pkgLock = path.join(this.root, appDir, 'package-lock.json');
        return {
            nodeModules: fs.existsSync(nmPath),
            lockFile: fs.existsSync(pkgLock),
            dir: appDir,
        };
    }

    /**
     * Check all apps for dependencies
     */
    checkAllDeps() {
        return this.apps.map(app => ({
            name: app.name,
            ...this.checkDeps(app.dir),
        }));
    }

    /**
     * Scan recent logs for errors
     */
    scanLogs(logDir = 'logs') {
        const fullPath = path.join(this.root, logDir);
        const issues = [];
        try {
            if (!fs.existsSync(fullPath)) return { found: false, issues };
            const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.log') || f.endsWith('.md'));
            for (const file of files.slice(-5)) { // last 5 log files
                try {
                    const content = fs.readFileSync(path.join(fullPath, file), 'utf8');
                    const lines = content.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        if (/error|fail|crash|fatal|exception/i.test(lines[i])) {
                            issues.push({ file, line: i + 1, text: lines[i].trim().substring(0, 150) });
                        }
                    }
                } catch { /* skip unreadable */ }
            }
        } catch { /* dir not found */ }
        return { found: true, issues: issues.slice(0, 20) };
    }

    /**
     * Quick build check — verify .next directory exists
     */
    checkBuildArtifacts() {
        return this.apps.map(app => {
            const nextDir = path.join(this.root, app.dir, '.next');
            return {
                name: app.name,
                hasBuild: fs.existsSync(nextDir),
                dir: app.dir,
            };
        });
    }

    /**
     * Check if Ollama is running
     */
    async checkOllama() {
        return this.checkPort(11434);
    }

    /**
     * Full environment health check — the Sage Protocol
     */
    async fullCheck() {
        const ports = await this.checkAllPorts();
        const deps = this.checkAllDeps();
        const builds = this.checkBuildArtifacts();
        const logs = this.scanLogs();
        const ollama = await this.checkOllama();

        const report = {
            timestamp: new Date().toISOString(),
            services: ports,
            dependencies: deps,
            builds,
            ollama: ollama.status,
            logIssues: logs.issues.length,
            logSample: logs.issues.slice(0, 5),
            healthy: Object.values(ports).every(p => p.status === 'up') &&
                     deps.every(d => d.nodeModules) &&
                     builds.every(b => b.hasBuild),
        };

        return report;
    }

    /**
     * Print a formatted report to console
     */
    async printReport() {
        const r = await this.fullCheck();
        console.log('\n\x1b[36m╔══════════════════════════════════════════════╗\x1b[0m');
        console.log('\x1b[36m║     SAGE ENVIRONMENT CHECK                   ║\x1b[0m');
        console.log('\x1b[36m╚══════════════════════════════════════════════╝\x1b[0m\n');

        console.log('\x1b[33m  Services:\x1b[0m');
        for (const [name, info] of Object.entries(r.services)) {
            const icon = info.status === 'up' ? '\x1b[32m●\x1b[0m' : '\x1b[31m○\x1b[0m';
            console.log(`    ${icon} ${name} (:${info.port}) — ${info.status}`);
        }

        console.log('\n\x1b[33m  Dependencies:\x1b[0m');
        for (const dep of r.dependencies) {
            const icon = dep.nodeModules ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
            console.log(`    ${icon} ${dep.name} — ${dep.nodeModules ? 'installed' : 'MISSING'}`);
        }

        console.log('\n\x1b[33m  Builds:\x1b[0m');
        for (const b of r.builds) {
            const icon = b.hasBuild ? '\x1b[32m✓\x1b[0m' : '\x1b[33m○\x1b[0m';
            console.log(`    ${icon} ${b.name} — ${b.hasBuild ? 'ready' : 'not built'}`);
        }

        console.log(`\n\x1b[33m  Ollama:\x1b[0m ${r.ollama === 'up' ? '\x1b[32monline\x1b[0m' : '\x1b[31moffline\x1b[0m'}`);
        console.log(`\x1b[33m  Log Issues:\x1b[0m ${r.logIssues}`);
        console.log(`\n\x1b[33m  Overall:\x1b[0m ${r.healthy ? '\x1b[32m● HEALTHY\x1b[0m' : '\x1b[31m○ ISSUES DETECTED\x1b[0m'}\n`);

        return r;
    }
}
