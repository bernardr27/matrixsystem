@echo off
cd /d "%~dp0.."
echo [MATRIX] Starting Ops Autopilot Daemon...
node scripts\tools\autopilot_daemon.cjs --interval-min=15 --quick
