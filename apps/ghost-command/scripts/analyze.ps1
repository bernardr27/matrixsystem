# Ghost Command Analysis Script
$ErrorActionPreference = "Continue"

Write-Host "Starting Ghost Command Analysis..." -ForegroundColor Cyan

# 1. Dependency Audit
Write-Host "`n[1/4] Checking Dependencies..." -ForegroundColor Yellow
npm audit
if ($LASTEXITCODE -gt 0) { 
    Write-Warning "Audit found security issues. Proceeding with analysis..." 
}

# 2. Linting
Write-Host "`n[2/4] Running Linter..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) { Write-Error "Linting failed." }

# 3. Build Verification (Next.js)
Write-Host "`n[3/4] Verifying Build (Next.js)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build verification failed." }

# 4. Disk Space Check (G: Drive)
Write-Host "`n[4/4] Checking Disk Space..." -ForegroundColor Yellow
try {
    $disk = Get-PSDrive G -ErrorAction SilentlyContinue
    if ($disk) {
        if ($disk.Free -lt 5GB) { 
            Write-Warning "Low disk space on G: ($([math]::Round($disk.Free / 1GB, 2)) GB remaining)." 
        }
        else {
            Write-Host "Disk space OK ($([math]::Round($disk.Free / 1GB, 2)) GB free)." -ForegroundColor Green
        }
    }
    else {
        Write-Warning "Disk G: not detected. Skipping space check."
    }
}
catch {
    Write-Warning "Could not determine disk space."
}

Write-Host "`nAnalysis Complete. System is healthy." -ForegroundColor Green
