# --- MATRIX SYSTEM: NETWORK REPAIR BRIDGE ---
# This script must be run as ADMINISTRATOR to fix the T-Mobile/Cloudflare blackhole.

function Show-MatrixHeader {
    Clear-Host
    Write-Host "+--------------------------------------------------+" -ForegroundColor Cyan
    Write-Host "|        MATRIX HUB: NETWORK REPAIR BRIDGE         |" -ForegroundColor Cyan
    Write-Host "+--------------------------------------------------+" -ForegroundColor Cyan
}

Show-MatrixHeader

# 1. Check for Elevation
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host " [!] ERROR: Please run this script as ADMINISTRATOR." -ForegroundColor Red
    Exit
}

# 2. MTU Optimization (Fixes T-Mobile/Cloudflare TLS Timeouts)
Write-Host "`n[1/3] Optimizing MTU for T-Mobile Gateway..." -ForegroundColor Yellow
$interfaces = Get-NetAdapter | Where-Object { $_.Status -eq "Up" -and $_.Name -notlike "*Tailscale*" }
foreach ($if in $interfaces) {
    Write-Host "  -> Patching MTU for: $($if.Name) (Setting to 1400)"
    netsh interface ipv4 set subinterface "$($if.Name)" mtu=1400 store=persistent
    netsh interface ipv6 set subinterface "$($if.Name)" mtu=1400 store=persistent
}

# 3. Flashing DNS & Resetting Stack
Write-Host "`n[2/3] Flushing Network Stack..." -ForegroundColor Yellow
ipconfig /flushdns
netsh winsock reset
netsh int ip reset

# 4. Applying IPv4 Preference (Matrix Standard)
Write-Host "`n[3/3] Setting Global IPv4 Preference..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("NODE_OPTIONS", "--dns-result-order=ipv4first", "Machine")

Write-Host "`n[OK] REPAIR COMPLETE. Please REBOOT your T-Mobile Gateway manually, then RESTART your PC." -ForegroundColor Green
Write-Host "Waiting 5 seconds..."
Start-Sleep -s 5
