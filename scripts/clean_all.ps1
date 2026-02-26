# Matrix Clean All Apps
# Runs clean script on all Matrix apps

Write-Host "--- MATRIX FULL CLEAN ---" -ForegroundColor Cyan

$MatrixRoot = Split-Path -Parent $PSScriptRoot
$Apps = @("reflect", "nexus", "ghost-command", "citadel", "rocket-command-pro")

foreach ($App in $Apps) {
    $AppPath = Join-Path $MatrixRoot "apps\$App"
    if (Test-Path $AppPath) {
        Write-Host "[CLEAN] Cleaning $App..." -ForegroundColor Yellow
        
        # Remove .next folder
        $NextPath = Join-Path $AppPath ".next"
        if (Test-Path $NextPath) {
            Remove-Item -Path $NextPath -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  Removed .next" -ForegroundColor Green
        }
        
        # Remove .turbo folder
        $TurboPath = Join-Path $AppPath ".turbo"
        if (Test-Path $TurboPath) {
            Remove-Item -Path $TurboPath -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  Removed .turbo" -ForegroundColor Green
        }
        
        # Remove node_modules/.cache
        $CachePath = Join-Path $AppPath "node_modules\.cache"
        if (Test-Path $CachePath) {
            Remove-Item -Path $CachePath -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  Removed node_modules/.cache" -ForegroundColor Green
        }
    }
}

Write-Host "--- CLEAN COMPLETE ---" -ForegroundColor Cyan
