---
description: Quick reference for AI agents working on Matrix
---

# Matrix Agent Workflow

## Before Any Work

1. **Read the master guide**:
   ```
   g:\matrix\MASTER\MATRIX_COMPLETE_GUIDE.md
   ```

2. **Check what's running**:
   - Look for running Node processes
   - Check if Sentinel is active

3. **Understand the structure**:
   - Apps are in `g:\matrix\apps\`
   - Backend is in `g:\matrix\core\`
   - Scripts are in `g:\matrix\scripts\`

## Key Files Reference

| What | Path |
|------|------|
| Master Guide | `g:\matrix\MASTER\MATRIX_COMPLETE_GUIDE.md` |
| Sentinel | `g:\matrix\core\sentinel.cjs` |
| Ghost Runner | `g:\matrix\core\ghost-runner.cjs` |
| Reflect App | `g:\matrix\apps\reflect\` |
| Nexus App | `g:\matrix\apps\nexus\` |
| Ghost-Command | `g:\matrix\apps\ghost-command\` |

## After Making Changes

1. **Test locally** - Refresh browser
2. **Update docs** if structure changed
3. **Update MATRIX_COMPLETE_GUIDE.md** if adding new files

## Troubleshooting Commands

```powershell
# Kill zombies
powershell -File g:\matrix\scripts\zombie_purge.ps1

# Clean caches
powershell -File g:\matrix\scripts\clean_all.ps1
```
