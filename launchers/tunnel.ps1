# ================================================================
# MATRIX TUNNEL LAUNCHER v2.0 - Cloudflare Quick Tunnels
# Access your Matrix apps from ANYWHERE on any device
# No account needed - Free - Encrypted - Zero config
# Auto-pushes URLs to Supabase for Gate UI display
# ================================================================

param(
    [string]$App = "all",
    [switch]$Stop
)

$ErrorActionPreference = "Continue"

# -- Ensure cloudflared is in PATH --
$cfDir = "C:\Program Files (x86)\cloudflared"
if (Test-Path $cfDir) { $env:Path += ";$cfDir" }

# -- Supabase config (for broadcasting URLs to Gate UI) --
$SUPABASE_URL = "https://phmnyenltuqxtkadnhpj.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobW55ZW5sdHVxeHRrYWRuaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4ODAsImV4cCI6MjA4NDc5Mzg4MH0.oyEVHSF8iZxvDD4scTmYuUOGrU82DVrPRJ1ABLBnZzM"

# -- App Registry --
$Apps = [ordered]@{
    "ghost"   = @{ Port = 5173; Name = "Ghost Command";     Color = "Cyan" }
    "reflect" = @{ Port = 3000; Name = "Reflect";           Color = "Blue" }
    "nexus"   = @{ Port = 3001; Name = "Nexus";             Color = "Magenta" }
    "rocket"  = @{ Port = 4000; Name = "RocketCommand Pro"; Color = "Red" }
}

# -- State tracking --
$script:tunnelProcs = @{}
$script:tunnelUrls = @{}
$script:logFiles = @{}
$urlFile = Join-Path $PSScriptRoot "..\logs\tunnel_urls.json"

function Write-Banner {
    Write-Host ""
    Write-Host "  +==================================================+" -ForegroundColor DarkYellow
    Write-Host "  |      MATRIX CLOUDFLARE TUNNEL SYSTEM v2.0        |" -ForegroundColor Yellow
    Write-Host "  |      Free - No domain needed - From anywhere     |" -ForegroundColor DarkYellow
    Write-Host "  +==================================================+" -ForegroundColor DarkYellow
    Write-Host ""
}

function Test-CloudflaredInstalled {
    $cf = Get-Command cloudflared -ErrorAction SilentlyContinue
    if (-not $cf) {
        Write-Host "  [ERROR] cloudflared not found. Install with:" -ForegroundColor Red
        Write-Host "  winget install --id Cloudflare.cloudflared" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  [OK] cloudflared found" -ForegroundColor Green
}

function Test-PortListening([int]$Port) {
    $conn = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $Port }
    return ($null -ne $conn)
}

function Push-UrlToSupabase {
    $urlPayload = @{}
    foreach ($key in $script:tunnelUrls.Keys) {
        $urlPayload[$key] = $script:tunnelUrls[$key]
    }
    $body = @{
        command = "sys:tunnel_urls"
        source  = "tunnel_launcher"
        status  = "active"
        output  = ($urlPayload | ConvertTo-Json -Compress)
    } | ConvertTo-Json

    try {
        $headers = @{
            "apikey"        = $SUPABASE_KEY
            "Authorization" = "Bearer $SUPABASE_KEY"
            "Content-Type"  = "application/json"
            "Prefer"        = "return=minimal"
        }
        Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/ghost_bridge" -Method Post -Headers $headers -Body $body -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  [SYNC] URLs pushed to Supabase -> visible in Gate UI" -ForegroundColor DarkGreen
    } catch {
        Write-Host "  [WARN] Supabase push failed (non-critical)" -ForegroundColor DarkYellow
    }
}

function Start-Tunnel([string]$Key, [hashtable]$Config) {
    $port = $Config.Port
    $name = $Config.Name
    $color = $Config.Color

    if (-not (Test-PortListening $port)) {
        Write-Host "  [SKIP] $name - port $port not listening" -ForegroundColor DarkGray
        return
    }

    Write-Host "  [TUNNEL] Opening $name (port $port)..." -ForegroundColor $color

    # Temp log file for stderr (cloudflared prints URL there)
    $logFile = Join-Path $env:TEMP "matrix_tunnel_$Key.log"
    $script:logFiles[$Key] = $logFile
    if (Test-Path $logFile) { Remove-Item $logFile -Force }

    # Start cloudflared as hidden background process
    $proc = Start-Process -FilePath "cloudflared" `
        -ArgumentList "tunnel", "--url", "http://localhost:$port" `
        -WindowStyle Hidden `
        -RedirectStandardError $logFile `
        -PassThru

    $script:tunnelProcs[$Key] = $proc

    # Poll log file for the trycloudflare.com URL (up to 15s)
    $url = $null
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-Path $logFile) {
            $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
            if ($content -match '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)') {
                $url = $Matches[1]
                break
            }
        }
    }

    if ($url) {
        $script:tunnelUrls[$Key] = $url
        Write-Host "  [LIVE]  $name -> " -NoNewline -ForegroundColor Green
        Write-Host "$url" -ForegroundColor White
    } else {
        Write-Host "  [WAIT]  $name - tunnel starting (check logs)" -ForegroundColor Yellow
    }
}

function Stop-AllTunnels {
    Write-Host ""
    Write-Host "  [STOP] Shutting down all tunnels..." -ForegroundColor Yellow

    foreach ($key in @($script:tunnelProcs.Keys)) {
        $proc = $script:tunnelProcs[$key]
        if ($proc -and !$proc.HasExited) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }

    Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force

    foreach ($log in $script:logFiles.Values) {
        if (Test-Path $log) { Remove-Item $log -Force -ErrorAction SilentlyContinue }
    }

    $script:tunnelProcs = @{}
    $script:tunnelUrls = @{}

    if (Test-Path $urlFile) { Remove-Item $urlFile -Force }

    # Push closed state to Supabase
    try {
        $headers = @{
            "apikey"        = $SUPABASE_KEY
            "Authorization" = "Bearer $SUPABASE_KEY"
            "Content-Type"  = "application/json"
            "Prefer"        = "return=minimal"
        }
        $body = @{ command = "sys:tunnel_urls"; source = "tunnel_launcher"; status = "closed"; output = "{}" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/ghost_bridge" -Method Post -Headers $headers -Body $body -ErrorAction SilentlyContinue | Out-Null
    } catch { }

    Write-Host "  [DONE] All tunnels terminated." -ForegroundColor Green
}

function Save-TunnelUrls {
    if ($script:tunnelUrls.Count -gt 0) {
        $logsDir = Split-Path $urlFile
        if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir -Force | Out-Null }
        $script:tunnelUrls | ConvertTo-Json | Set-Content $urlFile -Force
        Push-UrlToSupabase
    }
}

function Show-Summary {
    if ($script:tunnelUrls.Count -eq 0) {
        Write-Host ""
        Write-Host "  No tunnels established. Make sure your apps are running first." -ForegroundColor Yellow
        return
    }

    Write-Host ""
    Write-Host "  +---------------------------------------------------------------+" -ForegroundColor DarkYellow
    Write-Host "  |  YOUR APPS ARE NOW LIVE - Access from ANY device, ANYWHERE    |" -ForegroundColor Yellow
    Write-Host "  +---------------------------------------------------------------+" -ForegroundColor DarkYellow
    Write-Host ""

    foreach ($key in $script:tunnelUrls.Keys) {
        $app = $Apps[$key]
        $url = $script:tunnelUrls[$key]
        $pad = $app.Name.PadRight(20)
        Write-Host "    $pad -> " -NoNewline -ForegroundColor $app.Color
        Write-Host "$url" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "  Open any URL on your phone, tablet, or any device with internet." -ForegroundColor DarkGray
    Write-Host "  Encrypted HTTPS. No login needed. URLs change on restart." -ForegroundColor DarkGray
    Write-Host ""
}

# ================================================================
# MAIN
# ================================================================

Write-Banner
Test-CloudflaredInstalled

if ($Stop) {
    Stop-AllTunnels
    exit 0
}

Write-Host ""

if ($App -eq "all") {
    Write-Host "  Opening tunnels for ALL Matrix apps..." -ForegroundColor Yellow
    Write-Host ""
    foreach ($key in $Apps.Keys) {
        Start-Tunnel -Key $key -Config $Apps[$key]
    }
} else {
    $key = $App.ToLower()
    if ($Apps.Contains($key)) {
        Start-Tunnel -Key $key -Config $Apps[$key]
    } else {
        Write-Host "  [ERROR] Unknown app: $App" -ForegroundColor Red
        Write-Host "  Available: $($Apps.Keys -join ', ')" -ForegroundColor Yellow
        exit 1
    }
}

Save-TunnelUrls
Show-Summary

# Keep alive - monitor and auto-heal
Write-Host "  Tunnels running. Press Ctrl+C to stop all." -ForegroundColor DarkGray
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 30

        $restarted = $false
        foreach ($key in @($script:tunnelProcs.Keys)) {
            $proc = $script:tunnelProcs[$key]
            if ($proc.HasExited) {
                Write-Host "  [HEAL] $($Apps[$key].Name) tunnel died - restarting..." -ForegroundColor Yellow
                $script:tunnelProcs.Remove($key)
                $script:tunnelUrls.Remove($key)
                Start-Tunnel -Key $key -Config $Apps[$key]
                $restarted = $true
            }
        }
        if ($restarted) {
            Save-TunnelUrls
            Show-Summary
        }
    }
} finally {
    Stop-AllTunnels
}
