# Matrix Scripts Reference

All scripts are located in `g:\matrix\scripts\`

## Maintenance Scripts

### `matrix_cleaner.ps1`
**Purpose**: Clean development caches and artifacts

| Flag | Effect |
|------|--------|
| `-DryRun` | Preview without deleting |
| `-Verbose` | Show all checked paths |

**Cleans**:
- `.next` build folders
- `.turbo` cache folders
- `node_modules/.cache`
- `*.tsbuildinfo` files
- Log files (`*.log`)
- Old backups (keeps 5)

**Scheduled**: Every 6 hours via Sentinel

---

### `zombie_purge.ps1`
**Purpose**: Kill orphan processes and clean lock files

| Flag | Effect |
|------|--------|
| `-SkipPid <PID>` | Preserve specific process |

**Actions**:
1. Kills processes on ports 3000, 3001, 5173
2. Kills orphan `sentinel.cjs` / `ghost-runner.cjs` Node processes
3. Removes stale lock files

---

### `clean_all.ps1`
**Purpose**: Quick clean of all app caches

**Actions**:
- Removes `.next` from all apps
- Removes `.turbo` from all apps
- Removes `node_modules/.cache` from all apps

---

## Usage Examples

```powershell
# Preview cleanup
powershell -ExecutionPolicy Bypass -File scripts\matrix_cleaner.ps1 -DryRun

# Full cleanup
powershell -ExecutionPolicy Bypass -File scripts\matrix_cleaner.ps1

# Kill zombie processes
powershell -ExecutionPolicy Bypass -File scripts\zombie_purge.ps1

# Quick app cache clean
powershell -ExecutionPolicy Bypass -File scripts\clean_all.ps1
```

---

## Launcher Scripts

Located in `g:\matrix\launchers\`

| Script | Purpose |
|--------|---------|
| `matrix_boot.bat` | Start full Matrix with visible windows |
| `matrix_headless.bat` | Start Matrix in background |
| `MASTER_CONTROL.bat` | Legacy control script |
