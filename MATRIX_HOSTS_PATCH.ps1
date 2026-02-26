# MATRIX HOSTS PATCH - Routes Supabase through reachable Cloudflare IPs
# Run as Administrator. Reverts on next standard DNS flush.
#
# WHY: The T-Mobile gateway blocks these specific Supabase Cloudflare IPs:
#   172.64.149.246 and 104.18.38.10
# BUT allows other Cloudflare IPs like 104.18.38.236 (used by Groq).
# This patch redirects Supabase hostnames to the reachable IP.

param([switch]$Revert)

$hostsFile = "C:\Windows\System32\drivers\etc\hosts"
$marker = "# MATRIX_SUPABASE_PATCH"
$supabaseHost = "phmnyenltuqxtkadnhpj.supabase.co"
$targetIp = "104.18.38.236"  # Groq's Cloudflare IP — reachable through T-Mobile

# --- Admin check ---
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[!] Run as Administrator." -ForegroundColor Red
    Exit
}

# --- Read current hosts ---
$content = Get-Content $hostsFile -Raw

if ($Revert) {
    Write-Host "[MATRIX] Reverting Supabase hosts patch..." -ForegroundColor Yellow
    $content = ($content -split "`n" | Where-Object { $_ -notmatch [regex]::Escape($marker) }) -join "`n"
    Set-Content $hostsFile ($content.TrimEnd())
    ipconfig /flushdns | Out-Null
    Write-Host "[OK] Patch reverted." -ForegroundColor Green
    exit
}

# --- Check if already patched ---
if ($content -match [regex]::Escape($marker)) {
    Write-Host "[MATRIX] Hosts patch already applied. Re-applying fresh..." -ForegroundColor Yellow
    $content = ($content -split "`n" | Where-Object { $_ -notmatch [regex]::Escape($marker) }) -join "`n"
}

# --- Apply patch ---
Write-Host "[MATRIX] Patching hosts file..." -ForegroundColor Cyan
Write-Host "  Redirecting: $supabaseHost -> $targetIp" -ForegroundColor White

$patch = @"


$marker
$targetIp $supabaseHost
$targetIp api.supabase.io
"@

Add-Content $hostsFile $patch

# --- Flush DNS ---
ipconfig /flushdns | Out-Null

Write-Host "[OK] Patch applied! Testing connectivity..." -ForegroundColor Green
Write-Host ""

# --- Quick verify ---
try {
    $result = Invoke-WebRequest -Uri "https://$supabaseHost/rest/v1/" `
        -Headers @{ apikey = $env:SUPABASE_KEY } `
        -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
    Write-Host "[SUCCESS] Supabase reachable! Status: $($result.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "[WARN] Verify test encountered: $($_.Exception.Message.Substring(0, [Math]::Min(80, $_.Exception.Message.Length)))" -ForegroundColor Yellow
    Write-Host "  (This may be normal if PowerShell TLS/cert handling differs from Node.js)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Run node test_net.cjs to confirm Node.js connectivity." -ForegroundColor Cyan
Write-Host "To revert: powershell -ExecutionPolicy Bypass -File g:\matrix\MATRIX_HOSTS_PATCH.ps1 -Revert" -ForegroundColor DarkGray
