# ═══════════════════════════════════════════════════════════════
#  MATRIX COMPREHENSIVE UI CAPTURE SCRIPT
#  Captures every page across Nexus, Reflect, and Ghost Command
#  Uses Edge headless with iPhone 16 Plus mobile emulation
# ═══════════════════════════════════════════════════════════════

$outputDir = "g:\matrix\screenshots"
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }

$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"

function Capture-Page {
    param(
        [string]$Url,
        [string]$Name,
        [int]$Width = 430,
        [int]$Height = 932,
        [int]$Wait = 8000
    )

    $outFile = Join-Path $outputDir "$Name.png"
    Write-Host "  Capturing: $Name ($Url)..." -NoNewline

    & $edge --headless --disable-gpu --screenshot="$outFile" --window-size="${Width},${Height}" --hide-scrollbars --force-device-scale-factor=3 --user-agent="$mobileUA" --virtual-time-budget=$Wait --run-all-compositor-stages-before-draw "$Url" 2>&1 | Out-Null

    if (Test-Path $outFile) {
        $size = (Get-Item $outFile).Length
        if ($size -gt 5000) {
            Write-Host " OK ($([Math]::Round($size/1KB))KB)" -ForegroundColor Green
        }
        else {
            Write-Host " SMALL ($([Math]::Round($size/1KB))KB)" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host " FAILED" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor DarkCyan
Write-Host "  ║  MATRIX COMPREHENSIVE UI CAPTURE         ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor DarkCyan
Write-Host ""

# ── NEXUS (port 3001) ─────────────────────────────────────────
Write-Host "  ═══ NEXUS COMMAND ═══" -ForegroundColor Cyan

Capture-Page -Url "http://localhost:3001?noSplash=true" -Name "nexus_01_dashboard"
Capture-Page -Url "http://localhost:3001/analytics" -Name "nexus_02_analytics"
Capture-Page -Url "http://localhost:3001/diagnostics" -Name "nexus_03_diagnostics"
Capture-Page -Url "http://localhost:3001/integrations" -Name "nexus_04_integrations"
Capture-Page -Url "http://localhost:3001/knowledge" -Name "nexus_05_knowledge"
Capture-Page -Url "http://localhost:3001/settings" -Name "nexus_06_settings"

Write-Host ""

# ── REFLECT (port 3000) ──────────────────────────────────────
Write-Host "  ═══ REFLECT ═══" -ForegroundColor Magenta

# Core pages
Capture-Page -Url "http://localhost:3000?noSplash=true" -Name "reflect_01_landing"
Capture-Page -Url "http://localhost:3000/login" -Name "reflect_02_login"
Capture-Page -Url "http://localhost:3000/auth" -Name "reflect_03_auth"
Capture-Page -Url "http://localhost:3000/setup" -Name "reflect_04_setup"
Capture-Page -Url "http://localhost:3000/setup/initial" -Name "reflect_05_setup_initial"
Capture-Page -Url "http://localhost:3000/neural-initialize" -Name "reflect_06_neural_init"
Capture-Page -Url "http://localhost:3000/onboarding" -Name "reflect_07_onboarding"
Capture-Page -Url "http://localhost:3000/tutorial" -Name "reflect_08_tutorial"

# Dashboard & Session
Capture-Page -Url "http://localhost:3000/session?noSplash=true" -Name "reflect_09_session"
Capture-Page -Url "http://localhost:3000/dashboard-loading" -Name "reflect_10_dashboard_loading"

# Journal & Content
Capture-Page -Url "http://localhost:3000/journal" -Name "reflect_11_journal"
Capture-Page -Url "http://localhost:3000/archive" -Name "reflect_12_archive"
Capture-Page -Url "http://localhost:3000/capsule" -Name "reflect_13_capsule"

# Growth & Analysis
Capture-Page -Url "http://localhost:3000/growth" -Name "reflect_14_growth"
Capture-Page -Url "http://localhost:3000/insights" -Name "reflect_15_insights"
Capture-Page -Url "http://localhost:3000/patterns" -Name "reflect_16_patterns"
Capture-Page -Url "http://localhost:3000/graph" -Name "reflect_17_graph"

# Navigation & Discovery
Capture-Page -Url "http://localhost:3000/paths" -Name "reflect_18_paths"
Capture-Page -Url "http://localhost:3000/search" -Name "reflect_19_search"

# AI Features
Capture-Page -Url "http://localhost:3000/sage" -Name "reflect_20_sage"
Capture-Page -Url "http://localhost:3000/chat" -Name "reflect_21_chat"
Capture-Page -Url "http://localhost:3000/voice" -Name "reflect_22_voice"

# Profile & Settings
Capture-Page -Url "http://localhost:3000/profile" -Name "reflect_23_profile"
Capture-Page -Url "http://localhost:3000/settings" -Name "reflect_24_settings"
Capture-Page -Url "http://localhost:3000/settings/developer" -Name "reflect_25_settings_dev"

# System & Tools
Capture-Page -Url "http://localhost:3000/system" -Name "reflect_26_system"
Capture-Page -Url "http://localhost:3000/debug" -Name "reflect_27_debug"
Capture-Page -Url "http://localhost:3000/demo" -Name "reflect_28_demo"
Capture-Page -Url "http://localhost:3000/common" -Name "reflect_29_common"
Capture-Page -Url "http://localhost:3000/trash" -Name "reflect_30_trash"

Write-Host ""

# ── GHOST COMMAND (port 5173) ─────────────────────────────────
Write-Host "  ═══ GHOST COMMAND ═══" -ForegroundColor Yellow

Capture-Page -Url "http://localhost:5173" -Name "ghost_01_dashboard"

Write-Host ""
Write-Host "  ══════════════════════════════════════════" -ForegroundColor DarkCyan
Write-Host "  CAPTURE COMPLETE" -ForegroundColor Green
Write-Host "  Output: $outputDir" -ForegroundColor DarkGray

# Count results
$total = (Get-ChildItem "$outputDir\*.png" | Measure-Object).Count
Write-Host "  Total screenshots: $total" -ForegroundColor Cyan
Write-Host "  ══════════════════════════════════════════" -ForegroundColor DarkCyan
