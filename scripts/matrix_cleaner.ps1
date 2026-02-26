# Matrix Directory Cleaner v1.0
# Purpose: Automatic cleanup of cache files, build artifacts, and temp files

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

$MatrixRoot = Split-Path -Parent $PSScriptRoot

Write-Host "--- MATRIX DIRECTORY CLEANER ---" -ForegroundColor Cyan
if ($DryRun) { Write-Host "[DRY RUN MODE - No files will be deleted]" -ForegroundColor Yellow }

$TotalFreed = 0

function Get-FolderSize {
    param([string]$Path)
    if (Test-Path $Path) {
        return (Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    }
    return 0
}

function Remove-Directory {
    param([string]$Path, [string]$Label)
    if (Test-Path $Path) {
        $size = Get-FolderSize $Path
        $sizeMB = [math]::Round($size / 1MB, 2)
        if ($DryRun) {
            Write-Host "  [WOULD DELETE] $Label ($sizeMB MB)" -ForegroundColor Yellow
        }
        else {
            try {
                Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
                Write-Host "  [CLEANED] $Label ($sizeMB MB)" -ForegroundColor Green
                $script:TotalFreed += $size
            }
            catch {
                Write-Host "  [FAILED] $Label - $_" -ForegroundColor Red
            }
        }
    }
    elseif ($Verbose) {
        Write-Host "  [SKIP] $Label (not found)" -ForegroundColor DarkGray
    }
}

function Remove-FilePattern {
    param([string]$BasePath, [string]$Pattern, [string]$Label)
    $files = Get-ChildItem -Path $BasePath -Filter $Pattern -Recurse -Force -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        if ($DryRun) {
            Write-Host "  [WOULD DELETE] $($file.FullName) ($sizeMB MB)" -ForegroundColor Yellow
        }
        else {
            try {
                Remove-Item -Path $file.FullName -Force -ErrorAction Stop
                Write-Host "  [CLEANED] $($file.Name) ($sizeMB MB)" -ForegroundColor Green
                $script:TotalFreed += $file.Length
            }
            catch {
                Write-Host "  [FAILED] $($file.Name)" -ForegroundColor Red
            }
        }
    }
}

# --- CLEAN NEXT.JS CACHES ---
Write-Host "`n[1/5] Cleaning Next.js Build Caches..." -ForegroundColor Magenta
$Apps = @("reflect", "nexus", "ghost-command")
foreach ($App in $Apps) {
    $AppPath = Join-Path $MatrixRoot "apps\$App"
    if (Test-Path $AppPath) {
        Remove-Directory (Join-Path $AppPath ".next") "$App\.next"
        Remove-Directory (Join-Path $AppPath ".turbo") "$App\.turbo"
        Remove-Directory (Join-Path $AppPath "node_modules\.cache") "$App\node_modules\.cache"
    }
}

# --- CLEAN TYPESCRIPT BUILD CACHES ---
Write-Host "`n[2/5] Cleaning TypeScript Caches..." -ForegroundColor Magenta
foreach ($App in $Apps) {
    $AppPath = Join-Path $MatrixRoot "apps\$App"
    if (Test-Path $AppPath) {
        Remove-Directory (Join-Path $AppPath "tsconfig.tsbuildinfo") "$App\tsconfig.tsbuildinfo"
    }
}
Remove-FilePattern $MatrixRoot "*.tsbuildinfo" "TypeScript Build Info"

# --- CLEAN LOG FILES ---
Write-Host "`n[3/5] Cleaning Log Files..." -ForegroundColor Magenta
Remove-FilePattern $MatrixRoot "*.log" "Log Files"
Remove-FilePattern $MatrixRoot "npm-debug.log*" "NPM Debug Logs"
Remove-FilePattern $MatrixRoot "yarn-error.log*" "Yarn Error Logs"

# --- CLEAN TEMP/LOCK FILES ---
Write-Host "`n[4/5] Cleaning Temp & Lock Files..." -ForegroundColor Magenta
Remove-FilePattern (Join-Path $MatrixRoot "core") "*.lock" "Lock Files"
Remove-Directory (Join-Path $MatrixRoot "temp") "temp folder"
Remove-Directory (Join-Path $MatrixRoot ".temp") ".temp folder"

# --- CLEAN OLD BACKUPS (keep last 5) ---
Write-Host "`n[5/5] Pruning Old Backups..." -ForegroundColor Magenta
$BackupPath = Join-Path $MatrixRoot "backups"
if (Test-Path $BackupPath) {
    $Backups = Get-ChildItem -Path $BackupPath -Directory | Sort-Object LastWriteTime -Descending
    if ($Backups.Count -gt 5) {
        $ToDelete = $Backups | Select-Object -Skip 5
        foreach ($Backup in $ToDelete) {
            $size = Get-FolderSize $Backup.FullName
            $sizeMB = [math]::Round($size / 1MB, 2)
            if ($DryRun) {
                Write-Host "  [WOULD PRUNE] $($Backup.Name) ($sizeMB MB)" -ForegroundColor Yellow
            }
            else {
                try {
                    Remove-Item -Path $Backup.FullName -Recurse -Force
                    Write-Host "  [PRUNED] $($Backup.Name) ($sizeMB MB)" -ForegroundColor Green
                    $script:TotalFreed += $size
                }
                catch {
                    Write-Host "  [FAILED] $($Backup.Name)" -ForegroundColor Red
                }
            }
        }
    }
    else {
        Write-Host "  [OK] Only $($Backups.Count) backups, keeping all" -ForegroundColor DarkGray
    }
}

# --- SUMMARY ---
$TotalFreedMB = [math]::Round($TotalFreed / 1MB, 2)
Write-Host "`n--- CLEANUP COMPLETE ---" -ForegroundColor Cyan
if (!$DryRun) {
    Write-Host "Total space freed: $TotalFreedMB MB" -ForegroundColor Green
}
else {
    Write-Host "Dry run complete. Use without -DryRun to actually clean." -ForegroundColor Yellow
}
