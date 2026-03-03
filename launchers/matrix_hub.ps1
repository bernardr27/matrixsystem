# MATRIX CONTROL SYSTEM v8.1.0 - Premium Cloud Hub
# Hardened: CIM-detection, flicker-free, absolute-visibility
$Host.UI.RawUI.WindowTitle = "MATRIX SYSTEM CONTROL [PREMIUM HUB]"

# --- Resolve root path ---
$matrixRoot = Split-Path -Parent $PSScriptRoot
if (-not $matrixRoot -or $matrixRoot -eq '') {
    $matrixRoot = (Get-Item "$PSScriptRoot\..").FullName
}
Set-Location $matrixRoot

# --- Environment Parser ---
function Get-EnvValue {
    param([string]$key)
    $envFile = Join-Path $matrixRoot ".env"
    if (Test-Path $envFile) {
        $line = Get-Content $envFile | Where-Object { $_ -match "^$key=" }
        if ($line) { return $line.Split('=', 2)[1].Trim() }
    }
    return $null
}

# --- State ---
$Global:ActivePorts = @()
$Global:SessionStart = Get-Date
$Global:CloudMode = (Get-EnvValue "MATRIX_CLOUD_MODE") -eq "true"
$Global:SupabaseUrl = Get-EnvValue "SUPABASE_URL"
$Global:SupabaseKey = Get-EnvValue "SUPABASE_KEY"
$Global:CloudNodeStatus = "OFFLINE"
$Global:LastCloudUpdate = 0
$Global:LastLocalUpdate = 0
$Global:BridgeStatus = "OFFLINE"
$Global:CloudServices = $null

# ============================================================
#  UTILITY FUNCTIONS
# ============================================================

function Get-LanIP {
    try {
        $addr = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1
        if ($addr) { return $addr.IPAddress }
    }
    catch { }
    return "127.0.0.1"
}

function Update-ActivePorts {
    $nowTicks = (Get-Date).Ticks / 10000
    if (($nowTicks - $Global:LastLocalUpdate) -lt 2000) { return }

    try {
        $Global:ActivePorts = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort)
        
        # Robust process detection using CIM (Command Line awareness)
        $sentinel = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match "sentinel.cjs" }
        if ($sentinel) { $Global:BridgeStatus = "ACTIVE" }
        else { $Global:BridgeStatus = "OFFLINE" }
    }
    catch { 
        $Global:ActivePorts = @() 
        $Global:BridgeStatus = "OFFLINE"
    }
    $Global:LastLocalUpdate = $nowTicks
}

function Get-CloudStatus {
    if (-not $Global:CloudMode -or -not $Global:SupabaseUrl) { return }
    $nowTicks = (Get-Date).Ticks / 10000
    if (($nowTicks - $Global:LastCloudUpdate) -lt 5000) { return }

    try {
        $uri = "$($Global:SupabaseUrl)/rest/v1/matrix_instances?environment=eq.production&select=status,last_heartbeat&order=last_heartbeat.desc&limit=1"
        $headers = @{ "apikey" = $Global:SupabaseKey; "Authorization" = "Bearer $($Global:SupabaseKey)" }
        $res = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
        if ($res -and $res.status) {
            $last = [DateTime]::Parse($res.last_heartbeat).ToUniversalTime()
            $diff = ([DateTime]::UtcNow - $last).TotalSeconds
            # Increased threshold to 300s for cold starts and heavy loads
            if ($diff -lt 300) { $Global:CloudNodeStatus = "ONLINE " }
            else { $Global:CloudNodeStatus = "STALE  " }
        }
        else { $Global:CloudNodeStatus = "VACANT " }

        # --- Fetch the Latest Service Heartbeats for individual Cloud apps ---
        if ($Global:CloudNodeStatus -match "ONLINE|STALE") {
            $hbUri = "$($Global:SupabaseUrl)/rest/v1/ghost_bridge?command=eq.sys:heartbeat&source=eq.nexus_sentinel&select=output,created_at&order=created_at.desc&limit=1"
            $hbRes = Invoke-RestMethod -Uri $hbUri -Headers $headers -Method Get
            if ($hbRes -and $hbRes.Count -gt 0) {
                try {
                    $json = $hbRes[0].output | ConvertFrom-Json
                    $Global:CloudServices = $json.services
                }
                catch { $Global:CloudServices = $null }
            }
            else { $Global:CloudServices = $null }
        }
        else { $Global:CloudServices = $null }

    }
    catch { 
        $Global:CloudNodeStatus = "ERROR  " 
        $Global:CloudServices = $null 
    }
    $Global:LastCloudUpdate = $nowTicks
}

function Send-CloudCommand {
    param([string]$cmd)
    if (-not $Global:SupabaseUrl) { return }
    
    $uri = "$($Global:SupabaseUrl)/rest/v1/ghost_bridge"
    $headers = @{ "apikey" = $Global:SupabaseKey; "Authorization" = "Bearer $($Global:SupabaseKey)"; "Content-Type" = "application/json"; "Prefer" = "return=minimal" }
    $body = @{ "command" = $cmd; "status" = "pending"; "source" = "cli_hub" } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $body
        Write-Host "  [SHADOW] Broadcast: $cmd sent." -ForegroundColor Cyan
    }
    catch { }
}

# ============================================================
#  DASHBOARD
# ============================================================

function Draw-Dashboard {
    # Non-flickering Cursor Reset
    try { [Console]::SetCursorPosition(0, 0) } catch { Clear-Host }

    $ip = Get-LanIP
    $time = Get-Date -Format "HH:mm:ss"
    $uptime = '{0:D2}h {1:D2}m' -f [int]((Get-Date) - $Global:SessionStart).TotalHours, ((Get-Date) - $Global:SessionStart).Minutes
    
    Write-Host "  ================================================================" -ForegroundColor DarkCyan
    Write-Host "  [:MATRIX:] SYSTEM OS HUB v8.5.0 // SOVEREIGN EDITION " -ForegroundColor Cyan
    Write-Host "  ================================================================" -ForegroundColor DarkCyan
    
    Write-Host "    METRY: UP: $uptime   IP: $ip      TIME: $time" -ForegroundColor DarkGray
    Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkCyan
    
    # --- SPLIT VIEW: LOCAL VS CLOUD ---
    Write-Host "  [ LOCAL ENGINE ]                      [ CLOUD ENGINE ]" -ForegroundColor White
    Write-Host "  ----------------                      ----------------" -ForegroundColor DarkCyan
    
    # Sentinel & Bridge
    $locSent = if ($Global:BridgeStatus -eq "ACTIVE") { "ONLINE " } else { "OFFLINE" }
    $cLocSent = if ($locSent -match "ONLINE") { "Cyan" } else { "DarkGray" }
    
    $cldSent = if ($Global:CloudServices -and $Global:CloudServices.sentinel -eq 'online') { "ONLINE " } else { "OFFLINE" }
    $cCldSent = if ($cldSent -match "ONLINE") { "Cyan" } else { "DarkGray" }

    $gbLoc = if ($Global:BridgeStatus -eq "ACTIVE") { "ACTIVE " } else { "OFFLINE" }
    $cGbLoc = if ($gbLoc -match "ACTIVE") { "Green" } else { "DarkGray" }

    $gbCld = if ($Global:CloudNodeStatus -match "ONLINE|STALE") { "ACTIVE " } else { "OFFLINE" }
    $cGbCld = if ($gbCld -match "ACTIVE") { "Green" } else { "DarkGray" }

    Write-Host "  [0] Sentinel  [" -ForegroundColor Gray -NoNewline
    Write-Host $locSent -ForegroundColor $cLocSent -NoNewline
    Write-Host "]              [P] Sentinel  [" -ForegroundColor Gray -NoNewline
    Write-Host $cldSent -ForegroundColor $cCldSent -NoNewline
    Write-Host "]" -ForegroundColor Gray

    Write-Host "  Ghost Bridge  [" -ForegroundColor Gray -NoNewline
    Write-Host $gbLoc -ForegroundColor $cGbLoc -NoNewline
    Write-Host "]              Ghost Bridge  [" -ForegroundColor Gray -NoNewline
    Write-Host $gbCld -ForegroundColor $cGbCld -NoNewline
    Write-Host "]" -ForegroundColor Gray
    Write-Host ""

    # Microservices Map
    $Apps = @(
        @{ Name = "Reflect"; Port = 3000 },
        @{ Name = "Nexus"; Port = 3001 },
        @{ Name = "Citadel"; Port = 3005 },
        @{ Name = "Rocket"; Port = 4000 },
        @{ Name = "Ghost"; Port = 5173 }
    )

    for ($i = 0; $i -lt $Apps.Length; $i++) {
        $app = $Apps[$i]
        
        # Local Status
        $lStat = if ($Global:ActivePorts -contains $app.Port) { "ONLINE " } else { "OFFLINE" }
        $lCol = if ($lStat -match "ONLINE") { "Green" } else { "DarkGray" }
        
        # Cloud Status
        $key = $app.Name.ToLower()
        $cStat = if ($Global:CloudServices -and $Global:CloudServices.$key -eq 'online') { "ONLINE " } else { "OFFLINE" }
        $cCol = if ($cStat -match "ONLINE") { "Green" } else { "DarkGray" }

        # Formatting
        $leftPad = $app.Name.PadRight(10)
        $rightPad = $app.Name.PadRight(10)

        Write-Host "  [$($i+1)] $leftPad [$lStat]            " -NoNewline -ForegroundColor $lCol
        Write-Host "[$([char](81+$i))] $rightPad [$cStat]" -ForegroundColor $cCol
    }

    Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "  GLOBAL COMMANDS" -ForegroundColor Cyan
    Write-Host "    [I] IGNITE ALL LOCAL               [O] IGNITE ALL CLOUD"
    Write-Host "    [K] KILL ALL LOCAL                 [L] STOP ALL CLOUD"
    Write-Host "    [U] UPDATE CLOUD APPS              [E] VIEW EVENT LOGS"
    Write-Host "    [X] EXIT HUB"
    Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "    Press 1-5 to toggle apps, 0 for local Sentinel, P for cloud Sentinel." -ForegroundColor DarkGray
    Write-Host ""
}

# ============================================================
#  COMMAND HANDLER
# ============================================================

function Invoke-HubCommand {
    param([string]$choice)
    switch ($choice) {
        # CORE DAEMONS (0, P)
        "0" { 
            if ($Global:BridgeStatus -eq "ACTIVE") {
                Write-Host "  [*] Stopping Local Sentinel Daemon..." -ForegroundColor Yellow
                Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match "sentinel.cjs" } | Invoke-CimMethod -MethodName Terminate | Out-Null
            }
            else {
                Write-Host "  [*] Starting Local Sentinel Daemon..." -ForegroundColor Cyan
                Start-Process "node" -ArgumentList "apps/ghost-command/core/sentinel.cjs" -WindowStyle Hidden -WorkingDirectory $matrixRoot
            }
            Start-Sleep -Seconds 1
        }
        "P" { Send-CloudCommand "sys:cloud_start_sentinel"; Start-Sleep -Seconds 1 }

        # LOCAL TARGETS (1-5)
        "1" { Send-CloudCommand "sys:local_start_reflect"; Start-Sleep -Seconds 1 }
        "2" { Send-CloudCommand "sys:local_start_nexus"; Start-Sleep -Seconds 1 }
        "3" { Send-CloudCommand "sys:local_start_citadel"; Start-Sleep -Seconds 1 }
        "4" { Send-CloudCommand "sys:local_start_rocket"; Start-Sleep -Seconds 1 }
        "5" { Send-CloudCommand "sys:local_start_ghost"; Start-Sleep -Seconds 1 }

        # CLOUD TARGETS (Q-T)
        "Q" { Send-CloudCommand "sys:cloud_start_reflect"; Start-Sleep -Seconds 1 }
        "W" { Send-CloudCommand "sys:cloud_start_nexus"; Start-Sleep -Seconds 1 }
        "E" { Send-CloudCommand "sys:cloud_start_citadel"; Start-Sleep -Seconds 1 }
        "R" { Send-CloudCommand "sys:cloud_start_rocket"; Start-Sleep -Seconds 1 }
        "T" { Send-CloudCommand "sys:cloud_start_ghost"; Start-Sleep -Seconds 1 }

        # GLOBAL ACTION MACROS
        "I" {
            Write-Host "  [*] Igniting Local Systems..." -ForegroundColor Cyan
            $bat = Join-Path $matrixRoot "launchers\launch_silent.bat"
            if (Test-Path $bat) { Start-Process "cmd.exe" "/c `"$bat`"" -WindowStyle Hidden }
            Send-CloudCommand "sys:ignite"
            Start-Sleep -Seconds 2
        }
        "K" {
            Write-Host "  [!] EMERGENCY SYSTEM SHUTDOWN" -ForegroundColor Red
            Send-CloudCommand "sys:kill_all"
            Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
        "O" {
            Write-Host "  [*] Sending IGNITE signal to Cloud Servers..." -ForegroundColor Cyan
            Send-CloudCommand "sys:start"
            Start-Sleep -Seconds 2
        }
        "L" {
            Write-Host "  [*] Sending STOP signal to Cloud Servers..." -ForegroundColor Yellow
            Send-CloudCommand "sys:stop"
            Start-Sleep -Seconds 2
        }
        "U" {
            Write-Host "  [*] Sending UPDATE signal to Cloud Apps..." -ForegroundColor Green
            Send-CloudCommand "sys:update"
            Start-Sleep -Seconds 2
        }
        "E" { 
            Write-Host "  [REST] Syncing Cloud Events..." -ForegroundColor Cyan
            $uri = "$($Global:SupabaseUrl)/rest/v1/system_events?select=timestamp,event_type,message&order=timestamp.desc&limit=20"
            $headers = @{ "apikey" = $Global:SupabaseKey; "Authorization" = "Bearer $($Global:SupabaseKey)" }
            try {
                $events = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
                Clear-Host
                Write-Host "  --- REMOTE ENGINE LOGS ---" -ForegroundColor Cyan
                foreach ($e in $events) { Write-Host "  $($e.timestamp) [$($e.event_type.ToUpper())] $($e.message)" }
                Read-Host "  Press Enter to return"
            }
            catch { }
        }
        "X" { exit }
    }
}

# ============================================================
#  MAIN LOOP
# ============================================================

Clear-Host
while ($true) {
    try {
        if ([Console]::KeyAvailable) {
            $key = [Console]::ReadKey($true)
            Invoke-HubCommand $key.KeyChar.ToString().ToUpper()
            Clear-Host
        }
    }
    catch { }
    
    Update-ActivePorts
    Get-CloudStatus
    Draw-Dashboard
    Start-Sleep -Milliseconds 600
}
