#!/usr/bin/env node
const { execFile } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);

function readFlag(name, fallback) {
  const prefix = `--${name}=`;
  const hit = args.find((arg) => arg.startsWith(prefix));
  if (!hit) return fallback;
  const value = Number(hit.slice(prefix.length));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const intervalMinutes = readFlag('interval-min', 15);
const quickMode = args.includes('--quick');
const heal = !args.includes('--check-only');

const scriptPath = path.join(ROOT, 'scripts', 'tools', 'ops_autopilot.cjs');

let running = false;

function runCycle() {
  if (running) return;
  running = true;

  const cmdArgs = [scriptPath, '--json'];
  if (heal) cmdArgs.push('--heal');
  if (quickMode) cmdArgs.push('--quick');

  execFile(process.execPath, cmdArgs, {
    cwd: ROOT,
    windowsHide: true,
    timeout: Math.max(120000, intervalMinutes * 60 * 1000 - 5000),
    maxBuffer: 8 * 1024 * 1024
  }, (error, stdout, stderr) => {
    const now = new Date().toISOString();
    if (error) {
      const detail = stderr || stdout || error.message;
      console.error(`[autopilot_daemon] ${now} cycle_failed ${detail}`);
    } else {
      try {
        const data = JSON.parse(String(stdout || '{}'));
        console.log(`[autopilot_daemon] ${now} ok=${Boolean(data.ok)} score=${data.summary?.healthScore ?? 'n/a'}`);
      } catch {
        console.log(`[autopilot_daemon] ${now} cycle_completed`);
      }
    }
    running = false;
  });
}

console.log(`[autopilot_daemon] started interval=${intervalMinutes}m mode=${heal ? 'heal' : 'check'}`);
runCycle();
setInterval(runCycle, intervalMinutes * 60 * 1000);
