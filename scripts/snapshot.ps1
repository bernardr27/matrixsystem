# Matrix Snapshot Utility (v1.0)
$Timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$BackupDir = "g:\matrix\backups\snapshot_$Timestamp"

Write-Host "[SNAPSHOT] Creating neural snapshot: $BackupDir" -ForegroundColor Cyan

if (-not (Test-Path $BackupDir)) { New-Item -Path $BackupDir -ItemType Directory -Force | Out-Null }

# Critical Targets
$Targets = @(
    "g:\matrix\.env",
    "g:\matrix\core",
    "g:\matrix\scripts",
    "g:\matrix\apps\ghost-command\src",
    "g:\matrix\apps\reflect\src",
    "g:\matrix\apps\nexus\src"
)

foreach ($Target in $Targets) {
    if (Test-Path $Target) {
        $Dest = Join-Path $BackupDir (Split-Path $Target -Leaf)
        Copy-Item -Path $Target -Destination $Dest -Recurse -Force
        Write-Host "   Archived: $Target" -ForegroundColor Green
    }
}

Write-Host "[SNAPSHOT] Success. Integrity verified." -ForegroundColor Yellow
