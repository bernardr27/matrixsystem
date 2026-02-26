const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const http = require('http');

class SysHandler {
    constructor(supabase, context) {
        this.supabase = supabase;
        this.context = context; // { gateStatus, gateUrl, LAUNCH_TIMESTAMP, SESSION_ID, config, killPort, pulse }
    }

    ROOT_DIR() {
        return path.resolve(__dirname, '../../../../');
    }

    async handle(cmd) {
        const action = cmd.command.replace('sys:', '').trim();

        // Gate Control
        if (action === 'open_gate') return this.handleGate(true, cmd.id);
        if (action === 'close_gate') return this.handleGate(false, cmd.id);

        // Heartbeat/Sync
        if (action === 'sync') {
            await this.context.pulse();
            return this.updateStatus(cmd.id, 'executed', 'MATRIX HUB: NEURAL PULSE SYNCHRONIZED');
        }

        // System Control
        let script = '';
        let description = `SYSTEM_ACTION: ${action.toUpperCase()}`;

        switch (action) {
            case 'lock': script = 'rundll32.exe user32.dll,LockWorkStation'; break;
            case 'vol_up': script = '(New-Object -ComObject WScript.Shell).SendKeys([char]175)'; break;
            case 'vol_down': script = '(New-Object -ComObject WScript.Shell).SendKeys([char]174)'; break;
            case 'mute': script = '(New-Object -ComObject WScript.Shell).SendKeys([char]173)'; break;
            case 'media_play': script = '(New-Object -ComObject WScript.Shell).SendKeys([char]179)'; break;

            case 'prune':
                script = 'Remove-Item -Path "$env:TEMP\\*" -Force -Recurse -ErrorAction SilentlyContinue; Write-Output "CACHE_PURGED"';
                description = "MATRIX HUB: EXECUTING METABOLIC PRUNE";
                break;

            case 'optimize':
                script = 'Get-Process | Where-Object { $_.WorkingSet -gt 500MB } | Sort-Object WorkingSet -Descending | Select-Object -First 3 | ForEach-Object { Write-Output "HEAVY_PROC: $($_.Name)" }';
                description = "MATRIX HUB: OPTIMIZING NEURAL LOAD";
                break;

            case 'help':
                const helpInfo = {
                    categories: {
                        "sys": ["lock", "vol_up", "vol_down", "mute", "prune", "optimize", "health", "clear_logs", "rebuild", "autopilot", "autopilot_full", "maintenance_window", "maintenance_exit", "emergency_recover", "reboot", "shutdown"],
                        "fs": ["list <path>", "read <path>", "get <path>", "download <path>", "write <path>"],
                        "vision": ["snap", "stream"],
                        "triage": ["health", "boot_health", "oracle", "evolve"],
                        "ralph": ["scan", "analyze", "fix"],
                        "sage": ["memory_vault", "autonomous"]
                    },
                    examples: [
                        "sys:health",
                        "sys:autopilot",
                        "fs:list apps/reflect",
                        "triage:health",
                        "npm: run build"
                    ]
                };
                return this.updateStatus(cmd.id, 'executed', `HELP_RESOURCES:${JSON.stringify(helpInfo)}`);

            case 'health':
                const ports = [3000, 3001, 5173];
                script = `foreach($p in ${ports.join(',')}){ $c=Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; if($c){ Write-Output "PORT_$p:ONLINE" }else{ Write-Output "PORT_$p:OFFLINE" } }`;
                description = "MATRIX HUB: DIAGNOSTIC PROBE";
                break;

            case 'clear_logs':
                script = 'Get-ChildItem -Path "logs/*.log" | Remove-Item -Force -ErrorAction SilentlyContinue; Write-Output "LOGS_CLEARED"';
                description = "MATRIX HUB: CLEARING SYSTEM TELEMETRY";
                break;

            case 'rebuild':
                await this.updateStatus(cmd.id, 'executing', 'MATRIX HUB: INITIATING SEQUENTIAL REBUILD...');
                const apps = ['reflect', 'nexus', 'ghost-command'];
                let rebuildResult = "";
                for (const appName of apps) {
                    await this.updateStatus(cmd.id, 'executing', `MATRIX HUB: BUILDING ${appName.toUpperCase()}...`);
                    try {
                        const { execSync } = require('child_process');
                        execSync('npm run build', { cwd: path.join(this.ROOT_DIR(), `apps/${appName}`), windowsHide: true });
                        rebuildResult += `${appName}:OK `;
                    } catch (e) {
                        rebuildResult += `${appName}:FAIL `;
                    }
                }
                return this.updateStatus(cmd.id, 'executed', `REBUILD_COMPLETE: ${rebuildResult.trim()}`);

            case 'restart_reflect':
                await this.context.killPort(3000);
                script = 'Start-Sleep -Seconds 2; Start-Process cmd -ArgumentList `"/k title REFLECT_OS && npm run dev`" -WorkingDirectory "g:\\matrix\\apps\\reflect"';
                description = "MATRIX HUB: REBOOTING REFLECT CORE";
                break;

            case 'stop_runner':
                console.log("[SHUTDOWN] TERMINATING GHOST RUNNER...");
                await this.supabase.from('ghost_bridge').insert({
                    command: 'sys:heartbeat', source: 'ghost_runner', status: 'silent',
                    output: JSON.stringify({ services: { runner: 'offline' }, timestamp: Date.now() })
                });
                setTimeout(() => process.exit(0), 200);
                return;

            case 'reboot':
                console.log("[SYSTEM] REBOOT INITIATED BY REMOTE COMMAND...");
                await this.notify("⚠️ SYSTEM REBOOT INITIATED (Timer: 30s)");
                await this.updateStatus(cmd.id, 'executed', 'SYSTEM_REBOOT: INITIATED (30s countdown)');
                script = 'shutdown /r /t 30 /c "Matrix Remote Reboot"';
                description = "MATRIX: SYSTEM REBOOT";
                break;

            case 'shutdown':
                console.log("[SYSTEM] SHUTDOWN INITIATED BY REMOTE COMMAND...");
                await this.notify("⚠️ SYSTEM SHUTDOWN INITIATED (Timer: 30s)");
                await this.updateStatus(cmd.id, 'executed', 'SYSTEM_SHUTDOWN: INITIATED (30s countdown)');
                script = 'shutdown /s /t 30 /c "Matrix Remote Shutdown"';
                description = "MATRIX: SYSTEM SHUTDOWN";
                break;

            case 'abort_shutdown':
                await this.notify("✅ POWER SEQUENCE ABORTED");
                script = 'shutdown /a';
                description = "MATRIX: POWER SEQUENCE ABORTED";
                break;
            case 'autopilot':
            case 'autopilot_full': {
                const mode = action === 'autopilot_full' ? '--heal --json' : '--heal --quick --json';
                const autopilotScript = path.join(this.ROOT_DIR(), 'scripts', 'tools', 'ops_autopilot.cjs');
                exec(`"${process.execPath}" "${autopilotScript}" ${mode}`, async (err, stdout, stderr) => {
                    const status = err ? 'failed' : 'executed';
                    const output = (stdout || stderr || '').toString().slice(0, 6000) || `AUTOPILOT_${status.toUpperCase()}`;
                    await this.updateStatus(cmd.id, status, output);
                    setTimeout(() => this.context.pulse(), 500);
                });
                return;
            }
            // Other actions are delegated to Sentinel, but we log them if they hit us
            case 'kill_all':
            case 'purge':
            case 'hazard_purge':
                console.log(`[HAZARD] Runner received ${action.toUpperCase()} signal. Self-terminating...`);
                process.exit(0);
                return;
        }

        if (script) {
            exec(`powershell -Command "${script}"`, async (err) => {
                const status = err ? 'failed' : 'executed';
                await this.updateStatus(cmd.id, status, `${description} ${status.toUpperCase()}`);
                setTimeout(() => this.context.pulse(), 500);
            });
        }
    }

    async handleGate(open, cmdId) {
        if (open) {
            this.context.gateStatus = 'online';
            this.context.gateUrl = `https://matrix-gate-${Math.random().toString(36).substring(7)}.trycloudflare.com`;
            await this.updateStatus(cmdId, 'executed', `GATE_OPEN: ${this.context.gateUrl}`);
        } else {
            this.context.gateStatus = 'offline';
            this.context.gateUrl = null;
            await this.updateStatus(cmdId, 'executed', 'GATE_CLOSED');
        }
        setTimeout(() => this.context.pulse(), 500);
    }

    async updateStatus(id, status, output) {
        await this.supabase.from('ghost_bridge').update({ status, output }).eq('id', id);
    }

    async notify(msg) {
        if (this.context.integrationHub) {
            // Broadcast to all active notification channels (Telegram, Slack, etc.)
            // For now specific to Telegram as "Primary Link"
            await this.context.integrationHub.notify('telegram', msg).catch(err => console.error('[NOTIFY_FAIL]', err.message));
        }
    }
}

module.exports = SysHandler;

