import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

/* ═══════════════════════════════════════════════════════
   EXECUTE API v3.0 — RocketCommand Pro
   Whitelisted system commands + tunnel control + health
   Supports: commandId (standard) + command (chat compat)
   ═══════════════════════════════════════════════════════ */

const execAsync = promisify(exec);

const MATRIX_ROOT = process.env.MATRIX_ROOT || 'g:\\matrix';

// ── Whitelisted Commands ──
const ALLOWED_COMMANDS: Record<string, { cmd: string; label: string; danger: boolean; special?: boolean }> = {
    // Status
    'status:ports': { cmd: 'powershell -Command "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(3000,3001,4000,5173,11434) } | Select-Object LocalPort, OwningProcess | Sort-Object LocalPort | Format-Table -AutoSize | Out-String"', label: 'Port Status', danger: false },
    'status:processes': { cmd: 'powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, CPU, @{N=\'Memory(MB)\';E={[math]::Round($_.WorkingSet/1MB,1)}}, StartTime | Format-Table -AutoSize | Out-String"', label: 'Node Processes', danger: false },
    'status:system': { cmd: 'powershell -Command "$cpu = (Get-CimInstance Win32_Processor).LoadPercentage; $mem = Get-CimInstance Win32_OperatingSystem; $usedGB = [math]::Round(($mem.TotalVisibleMemorySize - $mem.FreePhysicalMemory)/1MB, 1); $totalGB = [math]::Round($mem.TotalVisibleMemorySize/1MB, 1); $uptime = (Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime; Write-Output \\"CPU: ${cpu}% | RAM: ${usedGB}GB / ${totalGB}GB | Uptime: $($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m\\" | Out-String"', label: 'System Info', danger: false },
    'status:disk': { cmd: 'powershell -Command "Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{N=\\"Used(GB)\\";E={[math]::Round($_.Used/1GB,1)}}, @{N=\\"Free(GB)\\";E={[math]::Round($_.Free/1GB,1)}} | Format-Table -AutoSize | Out-String"', label: 'Disk Usage', danger: false },
    'status:tunnels': { cmd: 'powershell -Command "$procs = Get-Process cloudflared -ErrorAction SilentlyContinue; if ($procs) { $procs | Select-Object Id, CPU, StartTime | Format-Table -AutoSize | Out-String } else { Write-Output \\"No tunnel processes running\\" }"', label: 'Tunnel Status', danger: false },

    // Tunnel Management
    'tunnel:start': { cmd: '', label: 'Start Tunnels', danger: false, special: true },
    'tunnel:stop': { cmd: 'powershell -Command "Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force; Write-Output \\"All tunnels stopped\\""', label: 'Stop Tunnels', danger: true },
    'tunnel:urls': { cmd: '', label: 'Get Tunnel URLs', danger: false, special: true },

    // Builds
    'build:ghost': { cmd: `cd /d ${MATRIX_ROOT}\\apps\\ghost-command && npx next build 2>&1`, label: 'Build Ghost Command', danger: false },
    'build:reflect': { cmd: `cd /d ${MATRIX_ROOT}\\apps\\reflect && npx next build 2>&1`, label: 'Build Reflect', danger: false },
    'build:nexus': { cmd: `cd /d ${MATRIX_ROOT}\\apps\\nexus && npx next build 2>&1`, label: 'Build Nexus', danger: false },
    'build:rocket': { cmd: `cd /d ${MATRIX_ROOT}\\apps\\rocket-command && npx next build 2>&1`, label: 'Build RocketCommand', danger: false },

    // Health & Diagnostics
    'health:full': { cmd: '', label: 'Full Health Check', danger: false, special: true },
    'sage:scan': { cmd: '', label: 'Sage Environment Scan', danger: false, special: true },
    'network:ping': { cmd: '', label: 'Network Connectivity Test', danger: false, special: true },

    // Kill commands
    'kill:node': { cmd: 'powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Write-Output \\"All node processes killed\\""', label: 'Kill All Node', danger: true },
    'kill:tunnels': { cmd: 'powershell -Command "Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force; Write-Output \\"All tunnels killed\\""', label: 'Kill All Tunnels', danger: true },

    // Git
    'git:status': { cmd: `cd /d ${MATRIX_ROOT} && git status --short 2>&1`, label: 'Git Status', danger: false },
    'git:log': { cmd: `cd /d ${MATRIX_ROOT} && git log --oneline -10 2>&1`, label: 'Git Log (10)', danger: false },

    // NPM
    'npm:audit': { cmd: `cd /d ${MATRIX_ROOT} && npm audit --production 2>&1 | powershell -Command "Select-Object -First 30"`, label: 'NPM Audit', danger: false },

    // Cache
    'clear:cache': { cmd: `powershell -Command "Remove-Item -Recurse -Force ${MATRIX_ROOT}\\apps\\*\\.next -ErrorAction SilentlyContinue; Write-Output \\".next caches cleared for all apps\\""`, label: 'Clear Build Caches', danger: true },
};

/* ── Special Command Handlers ── */
async function handleSpecialCommand(commandId: string, req: NextRequest): Promise<{ output: string; success: boolean }> {
    switch (commandId) {
        case 'tunnel:start': {
            const tunnelScript = path.join(MATRIX_ROOT, 'launchers', 'tunnel.ps1');
            const cfPath = 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe';
            if (!fs.existsSync(cfPath)) return { output: '❌ cloudflared not found.\nInstall: winget install --id Cloudflare.cloudflared\nThen restart RocketCommand.', success: false };
            if (!fs.existsSync(tunnelScript)) return { output: `❌ Tunnel launcher not found at ${tunnelScript}`, success: false };
            const escaped = tunnelScript.replace(/\\/g, '\\\\');
            await execAsync(
                `powershell -ExecutionPolicy Bypass -Command "& { $env:Path += ';C:\\Program Files (x86)\\cloudflared'; Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \\"${escaped}\\" -App all' -WindowStyle Hidden }"`,
                { timeout: 10000 }
            );
            return { output: '✅ Tunnel launch initiated for all apps.\nURLs will appear in ~15-30 seconds.\nRun /run tunnel:urls to check status.', success: true };
        }

        case 'tunnel:urls': {
            const urlFile = path.join(MATRIX_ROOT, 'logs', 'tunnel_urls.json');
            try {
                const content = await readFile(urlFile, 'utf-8');
                const urls = JSON.parse(content);
                const entries = Object.entries(urls);
                if (entries.length === 0) return { output: 'No active tunnel URLs. Run /run tunnel:start first.', success: true };
                const formatted = entries.map(([app, url]) => `• ${app}: ${url}`).join('\n');
                return { output: `🌐 Active Tunnel URLs:\n${formatted}`, success: true };
            } catch {
                return { output: 'No tunnel URLs file found. Tunnels may not be running.\nRun /run tunnel:start to launch.', success: true };
            }
        }

        case 'health:full': {
            const ports = [
                { name: 'Reflect', port: 3000 },
                { name: 'Nexus', port: 3001 },
                { name: 'RocketCommand', port: 4000 },
                { name: 'Ghost Command', port: 5173 },
                { name: 'Ollama', port: 11434 },
            ];
            const results: string[] = ['═══ FULL HEALTH CHECK ═══', ''];
            const host = req.nextUrl.hostname || 'localhost';
            for (const { name, port } of ports) {
                try {
                    const res = await fetch(`http://${host}:${port}`, { signal: AbortSignal.timeout(2000) });
                    results.push(`✅ ${name} (${port}): ${res.status === 200 ? 'Healthy' : `Status ${res.status}`}`);
                } catch {
                    results.push(`❌ ${name} (${port}): Offline`);
                }
            }
            // System metrics
            try {
                const { stdout } = await execAsync('powershell -Command "$cpu = (Get-CimInstance Win32_Processor).LoadPercentage; $mem = Get-CimInstance Win32_OperatingSystem; $usedGB = [math]::Round(($mem.TotalVisibleMemorySize - $mem.FreePhysicalMemory)/1MB, 1); $totalGB = [math]::Round($mem.TotalVisibleMemorySize/1MB, 1); Write-Output \\"CPU: ${cpu}% | RAM: ${usedGB}/${totalGB}GB\\""', { timeout: 5000 });
                results.push('', `📊 System: ${stdout.trim()}`);
            } catch { /* skip */ }
            // Tunnels
            try {
                const { stdout } = await execAsync('powershell -Command "(Get-Process cloudflared -ErrorAction SilentlyContinue).Count"', { timeout: 3000 });
                const count = parseInt(stdout.trim()) || 0;
                results.push(`🌐 Tunnels: ${count > 0 ? `${count} active` : 'None running'}`);
            } catch { results.push('🌐 Tunnels: Unknown'); }
            return { output: results.join('\n'), success: true };
        }

        case 'sage:scan': {
            try {
                const res = await fetch('http://localhost:4000/api/sage-check', { signal: AbortSignal.timeout(10000) });
                if (!res.ok) throw new Error(`Status ${res.status}`);
                const data = await res.json();
                const lines = ['═══ SAGE ENVIRONMENT SCAN ═══', '', `Overall: ${data.overall}`];
                if (data.services) {
                    lines.push('', '── Services ──');
                    for (const [name, svc] of Object.entries(data.services) as any[]) {
                        lines.push(`${svc.online ? '✅' : '❌'} ${name} (${svc.port}): ${svc.online ? `${svc.latency}ms` : 'Offline'}`);
                    }
                }
                if (data.dependencies) {
                    lines.push('', '── Dependencies ──');
                    for (const [app, dep] of Object.entries(data.dependencies) as any[]) {
                        lines.push(`${dep.installed ? '✅' : '❌'} ${app}: node_modules ${dep.installed ? 'present' : 'missing'}`);
                    }
                }
                if (data.builds) {
                    lines.push('', '── Builds ──');
                    for (const [app, build] of Object.entries(data.builds) as any[]) {
                        lines.push(`${build.built ? '✅' : '⚠️'} ${app}: .next ${build.built ? 'exists' : 'missing'}`);
                    }
                }
                return { output: lines.join('\n'), success: true };
            } catch (err: unknown) {
                return { output: `❌ Sage scan failed: ${(err instanceof Error ? err.message : String(err))}`, success: false };
            }
        }

        case 'network:ping': {
            const host = req.nextUrl.hostname || 'localhost';
            const targets = [
                { name: 'Reflect', url: `http://${host}:3000` },
                { name: 'Nexus', url: `http://${host}:3001` },
                { name: 'RocketCommand', url: `http://${host}:4000` },
                { name: 'Ghost Command', url: `http://${host}:5173` },
                { name: 'Ollama', url: `http://${host}:11434` },
                { name: 'Supabase', url: 'https://phmnyenltuqxtkadnhpj.supabase.co' },
                { name: 'Groq API', url: 'https://api.groq.com' },
                { name: 'Google AI', url: 'https://generativelanguage.googleapis.com' },
            ];
            const results: string[] = ['═══ NETWORK CONNECTIVITY ═══', ''];
            for (const { name, url } of targets) {
                const start = Date.now();
                try {
                    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
                    results.push(`✅ ${name}: ${res.status} (${Date.now() - start}ms)`);
                } catch {
                    results.push(`❌ ${name}: Unreachable (${Date.now() - start}ms)`);
                }
            }
            return { output: results.join('\n'), success: true };
        }

        default:
            return { output: `Unknown special command: ${commandId}`, success: false };
    }
}

/* ═══ GET — List Available Commands ═══ */
export async function GET() {
    const commands = Object.entries(ALLOWED_COMMANDS).map(([id, cfg]) => ({
        id,
        label: cfg.label,
        danger: cfg.danger,
        category: id.split(':')[0],
    }));
    return NextResponse.json({ commands });
}

/* ═══ POST — Execute Command ═══ */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Support both { commandId } and { command } for backward compatibility with chat
        const commandId = body.commandId || body.command;

        if (!commandId || !ALLOWED_COMMANDS[commandId]) {
            // If a string command was sent from chat that isn't a commandId,
            // try to match it to a whitelisted command by label/pattern
            const matchedId = Object.entries(ALLOWED_COMMANDS).find(([id, cfg]) => {
                const input = (body.command || body.commandId || '').toLowerCase();
                return input === id || input === cfg.label.toLowerCase();
            })?.[0];

            if (!matchedId) {
                return NextResponse.json({
                    error: `Unknown command: ${commandId || body.command}`,
                    hint: 'Use GET /api/execute to see available commands',
                    available: Object.keys(ALLOWED_COMMANDS),
                    success: false,
                }, { status: 400 });
            }

            // Process matched command
            return processCommand(matchedId, req);
        }

        return processCommand(commandId, req);
    } catch (err) {
        return NextResponse.json({ error: String(err), success: false }, { status: 500 });
    }
}

async function processCommand(commandId: string, req: NextRequest) {
    const config = ALLOWED_COMMANDS[commandId];
    const startTime = Date.now();

    // Handle special commands (internal API calls, multi-step)
    if (config.special) {
        const result = await handleSpecialCommand(commandId, req);
        return NextResponse.json({
            success: result.success,
            commandId,
            label: config.label,
            output: result.output,
            duration: Date.now() - startTime,
            timestamp: Date.now(),
        });
    }

    // Handle standard shell commands
    try {
        const { stdout, stderr } = await execAsync(config.cmd, {
            timeout: 120000,
            maxBuffer: 1024 * 1024,
        });

        return NextResponse.json({
            success: true,
            commandId,
            label: config.label,
            output: (stdout || '') + (stderr || ''),
            duration: Date.now() - startTime,
            timestamp: Date.now(),
        });
    } catch (err: unknown) {
        const execErr = err as { stdout?: string; stderr?: string; code?: number };
        return NextResponse.json({
            success: false,
            commandId,
            label: config.label,
            output: (execErr.stdout || '') + (execErr.stderr || '') || String(err),
            exitCode: execErr.code,
            duration: Date.now() - startTime,
            timestamp: Date.now(),
        });
    }
}
