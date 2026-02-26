Maintenance scripts

- `cleanup_organize.cjs` — safely archive old captures and logs to `backups/cleanup-<timestamp>`.

Usage examples:

```powershell
node .\scripts\maintenance\cleanup_organize.cjs --keep=50 --days=14    # dry-run
node .\scripts\maintenance\cleanup_organize.cjs --keep=50 --days=14 --prune  # actually move files
```

Notes:
- Dry-run by default. Use `--prune` to move files.
- Script keeps the latest N files per directory and archives older files older than the specified days.
