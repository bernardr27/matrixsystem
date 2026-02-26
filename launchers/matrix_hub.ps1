# MATRIX CONTROL SYSTEM v6.2 - Premium Hub
# Hardened: safe console input, absolute paths, no flicker
$Host.UI.RawUI.WindowTitle = "MATRIX SYSTEM CONTROL [LIVE DASHBOARD]"

# --- Resolve root path (works from launchers/ subfolder) ---
$matrixRoot = Split-Path -Parent $PSScriptRoot
if (-not $matrixRoot -or $matrixRoot -eq '') {
    $matrixRoot = (Get-Item "$PSScriptRoot\..").FullName
}
Set-Location $matrixRoot

# --- Safe Console Detection ---
# [Console]::KeyAvailable crashes in ISE, some terminal hosts, and certain
# shortcut launch modes. Detect once at startup and use Read-Host fallback.
$Global:ConsoleMode = $false
try {
    [void][Console]::KeyAvailable
    $Global:ConsoleMode = $true
}
catch {
    $Global:ConsoleMode = $false
}

# --- State ---
$Global:ActivePorts = @()
$Global:SessionStart = Get-Date
$Global:DashLines = 15

# ============================================================
#  UTILITY FUNCTIONS
# ============================================================

function Get-LanIP {
    try {
        $addr = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.InterfaceAlias -notmatch 'Loopback' -and
            $_.IPAddress -notmatch '^169\.' -and
            $_.IPAddress -ne '127.0.0.1'
        } | Select-Object -First 1
        if ($addr) { return $addr.IPAddress }
    }
    catch { }
    return "127.0.0.1"
}

function Update-ActivePorts {
    try {
        $Global:ActivePorts = @(
            Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty LocalPort
        )
    }
    catch {
        $Global:ActivePorts = @()
    }
}

function Get-StatusText {
    param([int]$port)
    if ($Global:ActivePorts -contains $port) { return "ONLINE " }
    return "OFFLINE"
}

function Get-StatusColor {
    param([int]$port)
    if ($Global:ActivePorts -contains $port) { return "Green" }
    return "DarkGray"
}

function Get-Uptime {
    $span = (Get-Date) - $Global:SessionStart
    return '{0:D2}h {1:D2}m {2:D2}s' -f [int]$span.TotalHours, $span.Minutes, $span.Seconds
}

# Pad line to full console width so old text is overwritten
function Write-PadLine {
    param([string]$Text, [string]$Color = 'White')
    $width = 80
    try { $width = [Console]::WindowWidth } catch { }
    $padded = $Text.PadRight($width)
    Write-Host $padded -ForegroundColor $Color
}

# ============================================================
#  STOP / LOADING / HELP
# ============================================================

function Stop-System {
    Write-Host ""
    Write-Host "  [SYSTEM] Initiating Shutdown Sequence..." -ForegroundColor Yellow
    $stopBat = Join-Path $matrixRoot "launchers\stop.bat"
    if (Test-Path $stopBat) {
        cmd /c "$stopBat" > $null 2>&1
    }
    else {
        # Inline fallback: kill node and free ports
        Stop-Process -Name node -Force -ErrorAction SilentlyContinue
        foreach ($p in 3000, 3001, 3005, 4000, 5173) {
            $c = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
            if ($c) {
                $c.OwningProcess | Sort-Object -Unique | ForEach-Object {
                    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
    Start-Sleep -Seconds 2
    Write-Host "  [OK] All Processes Terminated." -ForegroundColor Green
    Start-Sleep -Seconds 1
}

function Show-Loading {
    $chars = @("|", "/", "-", "\")
    for ($i = 0; $i -lt 10; $i++) {
        foreach ($c in $chars) {
            Write-Host -NoNewline "`r  Loading $c "
            Start-Sleep -Milliseconds 50
        }
    }
    Write-Host "`r               "
}

function Show-Help {
    Clear-Host
    Write-Host ""
    Write-Host "  MATRIX HUB - COMMAND REFERENCE" -ForegroundColor Cyan
    Write-Host "  ================================" -ForegroundColor DarkCyan
    Write-Host ""
    Write-Host "  CORE OPERATIONS" -ForegroundColor Green
    Write-Host "    1  SILENT START    Background Production Mode"
    Write-Host "    2  VISIBLE START   Debug Console with Logs"
    Write-Host "    3  SYSTEM STOP     Kill All Services"
    Write-Host ""
    Write-Host "  ADVANCED TOOLS" -ForegroundColor Magenta
    Write-Host "    4  AI MANAGER      Ollama / Ralph Agents"
    Write-Host "    5  DEPLOYMENT      Vercel / Supabase Push"
    Write-Host "    6  MAINTENANCE     Backup / Clean / Triage"
    Write-Host ""
    Write-Host "  LIVE CONTROLS" -ForegroundColor Yellow
    Write-Host "    L  VIEW LOGS       Real-time Log Stream"
    Write-Host "    D  DIAGNOSTICS     Full System Health Check"
    Write-Host "    K  KILL PROCESS    Force Stop by Port"
    Write-Host "    H  HELP            This Guide"
    Write-Host "    Q  QUIT            Exit Hub"
    Write-Host ""
    Read-Host "  Press Enter to return"
}

# ============================================================
#  DASHBOARD
# ============================================================

function Draw-Dashboard {
    # Try flicker-free redraw; fall back to clear
    try {
        [Console]::SetCursorPosition(0, 0)
    }
    catch {
        Clear-Host
    }

    $ip = Get-LanIP
    $time = Get-Date -Format "HH:mm:ss"
    $uptime = Get-Uptime

    Write-PadLine ""
    Write-PadLine "  MATRIX SYSTEM CONTROL HUB v6.2" "Cyan"
    Write-PadLine ""
    Write-PadLine "  IP: $ip    TIME: $time    UP: $uptime" "Yellow"
    Write-PadLine ""
    Write-PadLine "  SERVICE STATUS" "Green"

    $reflect = Get-StatusText 3000
    $nexus = Get-StatusText 3001
    $citadel = Get-StatusText 3005
    $rocket = Get-StatusText 4000
    $ghost = Get-StatusText 5173

    Write-PadLine "    Reflect .... $reflect  (3000)" (Get-StatusColor 3000)
    Write-PadLine "    Nexus ...... $nexus  (3001)" (Get-StatusColor 3001)
    Write-PadLine "    Citadel .... $citadel  (3005)" (Get-StatusColor 3005)
    Write-PadLine "    Rocket ..... $rocket  (4000)" (Get-StatusColor 4000)
    Write-PadLine "    Ghost ...... $ghost  (5173)" (Get-StatusColor 5173)
    Write-PadLine ""
    Write-PadLine "  COMMANDS" "Cyan"
    Write-PadLine "    [1] Start Silent   [2] Start Visible   [3] Stop System"
    Write-PadLine "    [4] AI Manager     [5] Deploy           [6] Maintenance"
    Write-PadLine "    [L] Logs  [D] Diag  [K] Kill  [H] Help  [Q] Quit"
    Write-PadLine ""
}

# ============================================================
#  COMMAND HANDLER
# ============================================================

function Invoke-HubCommand {
    param([string]$choice)

    switch ($choice) {
        "1" {
            Write-Host "  [*] Starting apps in background..." -ForegroundColor Green
            Show-Loading
            $bat = Join-Path $matrixRoot "launchers\launch_silent.bat"
            Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$bat`"" -WindowStyle Hidden
            Write-Host "  [OK] Silent launch initiated  (3000, 3001, 3005, 4000, 5173)" -ForegroundColor Green
            Start-Sleep -Seconds 3
        }
        "2" {
            Write-Host "  [*] Opening Debug Console..." -ForegroundColor Yellow
            $bat = Join-Path $matrixRoot "launchers\start.bat"
            Start-Process $bat
            Start-Sleep -Seconds 2
        }
        "3" {
            Stop-System
        }
        "4" {
            Write-Host ""
            Write-Host "  [AI MANAGER]  1 = Update Ollama   2 = Launch Ralph" -ForegroundColor Magenta
            $ai = Read-Host "  Select"
            if ($ai -eq "1") {
                Write-Host "  [*] Updating Ollama..." -ForegroundColor Yellow
                $bat = Join-Path $matrixRoot "launchers\update_ai.bat"
                Start-Process $bat -Wait
            }
            if ($ai -eq "2") {
                $script = Join-Path $matrixRoot "apps\ghost-command\core\ralph.cjs"
                Start-Process "node" -ArgumentList "`"$script`""
            }
        }
        "5" {
            Write-Host "  [*] Deploying..." -ForegroundColor Yellow
            $bat = Join-Path $matrixRoot "launchers\deploy.bat"
            Start-Process $bat
        }
        "6" {
            Write-Host ""
            Write-Host "  [MAINTENANCE]  1 = Backup   2 = Clean   3 = Triage" -ForegroundColor White
            $maint = Read-Host "  Select"
            if ($maint -eq "1") {
                $bat = Join-Path $matrixRoot "launchers\backup.bat"
                Start-Process $bat -Wait
            }
            if ($maint -eq "2") {
                $ps1 = Join-Path $matrixRoot "scripts\clean_all.ps1"
                powershell -ExecutionPolicy Bypass -File "$ps1"
            }
            if ($maint -eq "3") {
                $script = Join-Path $matrixRoot "apps\ghost-command\core\triage.cjs"
                Start-Process "node" -ArgumentList "`"$script`" --interactive"
            }
        }
        "L" {
            $logFile = Join-Path $matrixRoot "logs\matrix_session.log"
            if (Test-Path $logFile) {
                Start-Process "powershell" -ArgumentList "-NoExit -Command Get-Content -Wait `"$logFile`""
            }
            else {
                Write-Host "  [!] No log file found yet. Start the system first." -ForegroundColor DarkGray
                Start-Sleep -Seconds 2
            }
        }
        "D" {
            Write-Host "  [*] Running Diagnostics..." -ForegroundColor Yellow
            $bat = Join-Path $matrixRoot "launchers\diagnostics.bat"
            if (Test-Path $bat) {
                Start-Process $bat -Wait
            }
            else {
                # Inline quick diagnostics
                Write-Host ""
                foreach ($p in 3000, 3001, 3005, 4000, 5173) {
                    $s = if ($Global:ActivePorts -contains $p) { "ONLINE" } else { "OFFLINE" }
                    Write-Host "    Port ${p}: $s"
                }
                $nv = & node -v 2>$null
                if ($nv) { Write-Host "    Node: $nv" -ForegroundColor Green }
                else { Write-Host "    Node: NOT FOUND" -ForegroundColor Red }
                Write-Host ""
                Read-Host "  Press Enter to return"
            }
        }
        "K" {
            Write-Host ""
            Write-Host "  [KILL PROCESS] Enter port number:" -ForegroundColor Red
            $p = Read-Host "  Port"
            # Validate numeric input
            if ($p -match '^\d+$') {
                $port = [int]$p
                try {
                    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
                    if ($conns) {
                        # Filter out PID 0 (System Idle) and PID 4 (System)
                        $pids = @($conns.OwningProcess | Sort-Object -Unique | Where-Object { $_ -ne 0 -and $_ -ne 4 })
                        foreach ($pid in $pids) {
                            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        }
                        Write-Host "  [OK] Port $port freed ($($pids.Count) process(es) killed)." -ForegroundColor Green
                    }
                    else {
                        Write-Host "  [!] Nothing on port $port." -ForegroundColor DarkGray
                    }
                }
                catch {
                    Write-Host "  [!] Port $port is not in use." -ForegroundColor DarkGray
                }
            }
            else {
                Write-Host "  [!] Invalid port number." -ForegroundColor DarkGray
            }
            Start-Sleep -Seconds 1
        }
        "H" {
            Show-Help
        }
        "Q" { exit }
        "0" { exit }
    }
}

# ============================================================
#  MAIN LOOP
# ============================================================

Clear-Host
Write-Host ""
Write-Host "  MATRIX HUB v6.2 starting..." -ForegroundColor Cyan
Write-Host "  Console mode: $(if ($Global:ConsoleMode) {'Live (KeyAvailable)'} else {'Polling (Read-Host)'})" -ForegroundColor DarkGray
Start-Sleep -Milliseconds 800

try {
    if ($Global:ConsoleMode) {
        # --- LIVE MODE: non-blocking key detection ---
        $lastRefresh = 0
        $refreshInterval = 1000

        while ($true) {
            if ([Console]::KeyAvailable) {
                $key = [Console]::ReadKey($true)
                $choice = $key.KeyChar.ToString().ToUpper()
                Invoke-HubCommand $choice
                # Force full redraw after any command
                Clear-Host
                $lastRefresh = 0
            }

            $now = (Get-Date).Ticks / 10000
            if (($now - $lastRefresh) -gt $refreshInterval) {
                Update-ActivePorts
                Draw-Dashboard
                $lastRefresh = $now
            }

            Start-Sleep -Milliseconds 100
        }
    }
    else {
        # --- FALLBACK MODE: prompt-based input ---
        # For hosts where [Console]::KeyAvailable is unavailable
        while ($true) {
            Update-ActivePorts
            Clear-Host
            Draw-Dashboard

            Write-Host "  Enter command (or wait 5s to refresh):" -ForegroundColor DarkGray
            $choice = $null

            # Use a background job to implement a timeout on Read-Host
            $job = Start-Job -ScriptBlock { Read-Host }
            $completed = $job | Wait-Job -Timeout 5
            if ($completed) {
                $choice = Receive-Job $job
            }
            Remove-Job $job -Force -ErrorAction SilentlyContinue

            if ($choice) {
                Invoke-HubCommand ($choice.Trim().ToUpper())
            }
        }
    }
}
catch {
    Write-Host ""
    Write-Host "  [FATAL] Hub Crash" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    Write-Host "  Stack: $($_.ScriptStackTrace)" -ForegroundColor DarkGray
    Write-Host ""
    Read-Host "  Press Enter to exit"
}
