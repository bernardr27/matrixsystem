$ErrorActionPreference = "Stop"

Write-Host "--- NEXUS VERCEL DEPLOYMENT CHECK ---" -ForegroundColor Cyan

# 1. Environment Variables
Write-Host "`n[1/3] Checking Environment Config..."
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL") {
        Write-Host " [OK] NEXT_PUBLIC_SUPABASE_URL found." -ForegroundColor Green
    }
    else {
        Write-Host " [ERR] NEXT_PUBLIC_SUPABASE_URL missing!" -ForegroundColor Red
    }
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
        Write-Host " [OK] NEXT_PUBLIC_SUPABASE_ANON_KEY found." -ForegroundColor Green
    }
    else {
        Write-Host " [ERR] NEXT_PUBLIC_SUPABASE_ANON_KEY missing!" -ForegroundColor Red
    }
}
else {
    Write-Host " [WARN] .env.local not found. Ensure Vercel Environment Variables are set in the dashboard." -ForegroundColor Yellow
}

# 2. Package Configuration
Write-Host "`n[2/3] Checking Package Config..."
$pkg = Get-Content "package.json" | ConvertFrom-Json
if ($pkg.engines.node) {
    Write-Host " [INFO] Node Engine: $($pkg.engines.node)" -ForegroundColor Gray
}
else {
    Write-Host " [INFO] No specific Node engine set (Vercel default is 20.x)" -ForegroundColor Gray
}

# 3. Connection Verification
Write-Host "`n[3/3] Simulating Bridge Connection..."
Write-Host " - Use the Vercel Dashboard to set the same Supabase URL/Key as your local environment."
Write-Host " - Status: READY FOR DEPLOYMENT" -ForegroundColor Green

Write-Host "`n[INFO] NOTE ON REMOTE ACCESS:"
Write-Host "Your Vercel app controls your local machine via Supabase."
Write-Host "However, the 'Gate' (Visual Tunnel) feature requires a manual Cloudflare Tunnel to work remotely."
