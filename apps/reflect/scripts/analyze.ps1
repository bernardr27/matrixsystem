$ErrorActionPreference = "Stop"

Write-Host "--- REFLECT OS INTEGRITY CHECK ---" -ForegroundColor Cyan

# 1. Dependency Audit
Write-Host "`n[1/3] Security Audit..."
try {
    npm audit --audit-level=high
    Write-Host " [OK] No high severity vulnerabilities." -ForegroundColor Green
}
catch {
    Write-Host " [WARN] Vulnerabilities detected. Run 'npm audit fix'." -ForegroundColor Yellow
}

# 2. Linting
Write-Host "`n[2/3] Code Quality (Lint)..."
try {
    npm run lint
    Write-Host " [OK] Linting passed." -ForegroundColor Green
}
catch {
    Write-Host " [ERR] Linting failed." -ForegroundColor Red
}

# 3. Build Verification
Write-Host "`n[3/3] Build Verification..."
try {
    npm run build
    Write-Host " [OK] Build successful." -ForegroundColor Green
}
catch {
    Write-Host " [ERR] Build failed." -ForegroundColor Red
}

Write-Host "`nAnalysis Complete." -ForegroundColor Cyan
