# MATRIX SOVEREIGN OS - ADVANCED COMMAND HUB v7.0
# Stunning ASCII UI with Live Service Polling
$Host.UI.RawUI.WindowTitle = "MATRIX SOVEREIGN OS [SYSTEM COMMAND HUB]"

$matrixRoot = Split-Path -Parent $PSScriptRoot
if (-not $matrixRoot -or $matrixRoot -eq '') {
    $matrixRoot = (Get-Item "$PSScriptRoot\..").FullName
}
Set-Location $matrixRoot

$Global:ConsoleMode = $false
try {
    [void][Console]::KeyAvailable
    $Global:ConsoleMode = $true
}
catch {
    $Global:ConsoleMode = $false
}

$Global:ActivePorts = @()
$Global:CloudMode = $false

function Load-Env {
    $envFile = Join-Path $matrixRoot ".env"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^#=]+)=(.*)$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                if ($name -eq "MATRIX_CLOUD_MODE") {
                    $Global:CloudMode = ($value -eq "true")
                }
            }
        }
    }
}

function Set-CloudMode {
    param([bool]$Enabled)
    $envFile = Join-Path $matrixRoot ".env"
    if (Test-Path $envFile) {
        $content = Get-Content $envFile
        $newContent = @()
        $found = $false
        foreach ($line in $content) {
            if ($line -match '^MATRIX_CLOUD_MODE=') {
                $newContent += "MATRIX_CLOUD_MODE=$($Enabled.ToString().ToLower())"
                $found = $true
            }
            else { $newContent += $line }
        }
        if (-not $found) { $newContent += "MATRIX_CLOUD_MODE=$($Enabled.ToString().ToLower())" }
        $newContent | Set-Content $envFile
        $Global:CloudMode = $Enabled
    }
}

function Get-LanIP {
    try {
        $addr = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.InterfaceAlias -notmatch 'Loopback' -and
            $_.IPAddress -notmatch '^169\.' -and
            $_.IPAddress -ne '127.0.0.1'
        } | Select-Object -First 1
        return $addr.IPAddress
    }
    catch { return "127.0.0.1" }
}

function Update-ActivePorts {
    try {
        $Global:ActivePorts = @(
            Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty LocalPort
        )
    }
    catch { $Global:ActivePorts = @() }
}

function Get-StatusIndicator {
    param([int]$port)
    if ($Global:ActivePorts -contains $port) { return "[ ONLINE  ] - port $port" }
    return "[ OFFLINE ] - port $port"
}

function Write-PadLine {
    param([string]$Text, [string]$Color = 'White', [string]$BgColor = 'Black')
    $width = 90
    try { $width = [Console]::WindowWidth } catch { }
    $padded = $Text.PadRight($width)
    Write-Host $padded -ForegroundColor $Color -BackgroundColor $BgColor
}

function Draw-Dashboard {
    try { [Console]::SetCursorPosition(0, 0) } catch { Clear-Host }

    $ip = Get-LanIP
    $time = Get-Date -Format "HH:mm:ss"

    $c1 = "Cyan"
    $c2 = "DarkCyan"
    $cY = "Yellow"
    $cG = "Green"
    $cR = "Red"
    $cW = "White"
    $cDG = "DarkGray"

    Write-PadLine ""
    Write-PadLine "  __  __       _        _      " $c1
    Write-PadLine " |  \/  | __ _| |_ _ __(_)_  __" $c1
    Write-PadLine " | |\/| |/ _` | __| '__| \ \/ /" $c1
    Write-PadLine " | |  | | (_| | |_| |  | |>  < " $c2
    Write-PadLine " |_|  |_|\__,_|\__|_|  |_/_/\_\" $c2
    Write-PadLine "                               " $c2
    Write-PadLine ""
    Write-PadLine "  SOVEREIGN OS COMMAND CENTER v7.0" "Magenta"
    Write-PadLine "  ================================================================" $cDG
    
    # Network Info
    $modeStr = if ($Global:CloudMode) { "CLOUD (Remote)" } else { "LOCAL (Native)" }
    $modeColor = if ($Global:CloudMode) { "Cyan" } else { "Green" }
    
    Write-PadLine "  SYSTEM IP : $ip        NODE MODE : $modeStr" $cY
    Write-PadLine "  LOCAL TIME: $time" $cDG
    Write-PadLine "  ================================================================" $cDG
    Write-PadLine ""
    Write-PadLine "  [ THE NEURAL MESH ]" $cW
    
    $rColor = if ($Global:ActivePorts -contains 3000) { "Green" } else { "DarkGray" }
    $nColor = if ($Global:ActivePorts -contains 3001) { "Green" } else { "DarkGray" }
    $cColor = if ($Global:ActivePorts -contains 3005) { "Green" } else { "DarkGray" }
    $rtColor = if ($Global:ActivePorts -contains 4000) { "Green" } else { "DarkGray" }
    $gColor = if ($Global:ActivePorts -contains 5173) { "Green" } else { "DarkGray" }

    Write-PadLine "    Reflect App        $(Get-StatusIndicator 3000)" $rColor
    Write-PadLine "    Nexus Analytics    $(Get-StatusIndicator 3001)" $nColor
    Write-PadLine "    Citadel OS         $(Get-StatusIndicator 3005)" $cColor
    Write-PadLine "    Rocket Command     $(Get-StatusIndicator 4000)" $rtColor
    Write-PadLine "    Ghost AI Core      $(Get-StatusIndicator 5173)" $gColor
    
    Write-PadLine ""
    Write-PadLine "  ================================================================" $cDG
    Write-PadLine "  [ CORE OPERATIONS ]" $cY
    Write-PadLine "    [1] IGNITE SYSTEM    (Launch Sentinel Orchestrator)" $cW
    Write-PadLine "    [2] HARD PURGE       (Kill zombies and reset state)" $cR
    Write-PadLine "    [3] AI AGENT HUB     (Ollama & Ralph Control)" $c1
    Write-PadLine "    [4] OPEN CITADEL     (Launch Desktop in Browser)" $cG
    Write-PadLine "    [5] DIAGNOSTICS      (Run core system check)" $cY
    Write-PadLine "    [6] CLOUD TOGGLE     (Switch Local/Cloud Bridge)" $c1
    Write-PadLine "    [7] CLOUD STATUS     (Fetch Remote Heartbeat)" $c2
    Write-PadLine "    [Q] EXIT TERMINAL" $cDG
    Write-PadLine ""
}

function Invoke-HubCommand {
    param([string]$choice)
    switch ($choice) {
        "1" {
            Clear-Host
            Write-Host "`n  [*] IGNITING NEURAL MESH..." -ForegroundColor Green
            $bat = Join-Path $matrixRoot "launchers\start.bat"
            Start-Process $bat
            Start-Sleep -Seconds 3
            # Force trigger redraw logic
            [Console]::Clear()
        }
        "2" {
            Clear-Host
            Write-Host "`n  [!] EXECUTING HAZARD PURGE..." -ForegroundColor Red
            $stopBat = Join-Path $matrixRoot "launchers\stop.bat"
            if (Test-Path $stopBat) { Start-Process $stopBat -Wait -WindowStyle Hidden }
            
            # Absolute kill
            Stop-Process -Name node -Force -ErrorAction SilentlyContinue
            foreach ($p in 3000, 3001, 3005, 4000, 5173) {
                $c = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue 2>$null
                if ($c) { $c.OwningProcess | Sort-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue 2>$null } }
            }
            Write-Host "`n  [OK] System Cleanse Complete." -ForegroundColor Green
            Start-Sleep -Seconds 2
            [Console]::Clear()
        }
        "3" {
            Clear-Host
            Write-Host "`n  [*] Opening AI Agent Settings..." -ForegroundColor Cyan
            $ai = Read-Host "  [1 = Ollama Engine, 2 = Ralph Daemon] "
            if ($ai -eq "1") { Start-Process (Join-Path $matrixRoot "launchers\update_ai.bat") -Wait }
            if ($ai -eq "2") { Start-Process "node" -ArgumentList "`"$(Join-Path $matrixRoot "apps\ghost-command\core\ralph.cjs")`"" }
            [Console]::Clear()
        }
        "4" {
            Clear-Host
            Write-Host "`n  [*] Connecting to Citadel OS..." -ForegroundColor Green
            Start-Process "http://localhost:3005/dashboard"
            Start-Sleep -Seconds 1
            [Console]::Clear()
        }
        "5" { 
            Clear-Host
            Write-Host "`n  [*] Running diagnostics..." -ForegroundColor Yellow
            $bat = Join-Path $matrixRoot "launchers\diagnostics.bat"
            if (Test-Path $bat) {
                Start-Process $bat -Wait
            }
            [Console]::Clear()
        }
        "6" {
            Clear-Host
            $newMode = -not $Global:CloudMode
            Write-Host "`n  [*] SWITCHING TO $(if ($newMode) { 'CLOUD' } else { 'LOCAL' }) MODE..." -ForegroundColor Cyan
            Set-CloudMode -Enabled $newMode
            Write-Host "  [OK] Environment Updated. Shutdown recommended for clean transition." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            [Console]::Clear()
        }
        "7" {
            Clear-Host
            Write-Host "`n  [*] FETCHING CLOUD HEARTBEAT..." -ForegroundColor Cyan
            # Use Node to query Supabase quickly
            $queryCmd = "const { createClient } = require('@supabase/supabase-js');" +
            "const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);" +
            "s.from('ghost_bridge').select('*').eq('command', 'sys:heartbeat').order('created_at', {ascending:false}).limit(1).then(r => console.log(JSON.stringify(r.data[0] || {})));"
            try {
                $out = node -e $queryCmd 2>$null
                if ($out) {
                    $hb = $out | ConvertFrom-Json
                    Write-Host "`n  LAST CLOUD PULSE: $($hb.created_at)" -ForegroundColor Green
                    Write-Host "  REMOTE STATUS   : $($hb.output)" -ForegroundColor White
                }
                else {
                    Write-Host "`n  [!] No recent cloud heartbeat found." -ForegroundColor Yellow
                }
            }
            catch {
                Write-Host "`n  [!] Error fetching heartbeat: $($_.Exception.Message)" -ForegroundColor Red
            }
            Write-Host "`n  Press any key to return..."
            $null = [Console]::ReadKey($true)
            [Console]::Clear()
        }
        "Q" { exit }
        "q" { exit }
        "0" { exit }
    }
}

Clear-Host
[Console]::CursorVisible = $false
$lastRefresh = 0

try {
    Load-Env
    Update-ActivePorts
    Draw-Dashboard
    while ($true) {
        $hasKey = $false
        try {
            if ($Global:ConsoleMode -and [Console]::KeyAvailable) {
                $hasKey = $true
            }
        }
        catch { }

        if ($hasKey) {
            $key = [Console]::ReadKey($true)
            $choice = $key.KeyChar.ToString().ToUpper()
            Invoke-HubCommand $choice
            $lastRefresh = 0
            Update-ActivePorts
        }
        elseif (-not $Global:ConsoleMode) {
            # Fallback for ISE or restricted shells where KeyAvailable crashes
            Draw-Dashboard
            Write-Host "`n  Fallback Mode Active - Enter Command (1-5, Q): " -NoNewline -ForegroundColor DarkGray
            $choice = Read-Host
            if ($choice) {
                Invoke-HubCommand $choice.Trim().ToUpper()
            }
            $lastRefresh = 0
            Update-ActivePorts
        }

        $now = (Get-Date).Ticks / 10000
        if (($now - $lastRefresh) -gt 2500 -and $Global:ConsoleMode) {
            Update-ActivePorts
            Draw-Dashboard
            $lastRefresh = $now
        }
        Start-Sleep -Milliseconds 100
    }
}
catch {
    Write-Host "`n  [FATAL CRASH] $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "  Press Enter to exit..."
    [Console]::CursorVisible = $true
}
