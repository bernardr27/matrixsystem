# Nexus v2.4 Maintenance Guide

This guide provides instructions for common maintenance tasks within the Nexus ecosystem.

## Core Maintenance Commands

### 1. Master Control
The primary interface for system management is the `MASTER_CONTROL.bat` in the root directory.
```powershell
.\MASTER_CONTROL.bat
```
This menu allows you to:
- Run System Diagnostics
- Perform Global Backups
- Ignite/Terminate all services

### 2. Manual Diagnostics
If you need to run specific checks:
- **Matrix Doctor**: `node scripts/tools/matrix_doctor.js` (Checks workspace integrity & ports)
- **Global Diag**: `node scripts/global_diag.js` (Checks version parity & service status)
- **Ops Autopilot**: `npm run ops:autopilot:heal` (Service/db/lint/readiness self-heal pass)
- **Ops Daemon**: `npm run ops:daemon` (Continuous unattended health remediation loop)

### 3. Cleaning Cache
If the application behaves unexpectedly after an upgrade, clear the Next.js cache using `matrix_maintenance.bat` or manually:
```powershell
rmdir /s /q nexus\.next
rmdir /s /q app\.next
rmdir /s /q ghost-command\.next
```

## Troubleshooting

### Port Collisions
If a service fails to start with "Address already in use":
1. Run **KILL SWITCH** (Option 4) in Master Control.
2. If issues persist, run `powershell scripts\zombie_purge.ps1` to clear stalled processes.

### Telemetry Desync
If Service Cards show "Offline" while the server is running:
1. Click the **Refresh** icon in the Nexus Dashboard.
2. Verify that **Sentinel** is running in the terminal.
