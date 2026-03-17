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

function Set-EnvValue {
    param([string]$key, [string]$value)
    $envFile = Join-Path $matrixRoot ".env"
    if (-not (Test-Path $envFile)) {
        "$key=$value" | Out-File -FilePath $envFile -Encoding utf8
        return
    }
    $lines = Get-Content $envFile
    $found = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^$key=") {
            $lines[$i] = "$key=$value"
            $found = $true
            break
        }
    }
    if (-not $found) { $lines += "$key=$value" }
    $lines | Set-Content -Path $envFile -Encoding utf8
}

# --- State ---
$Global:ActivePorts = @()
$Global:SessionStart = Get-Date
$Global:CloudMode = (Get-EnvValue "MATRIX_CLOUD_MODE") -eq "true"
$Global:LauncherCloudOnly = $true
$Global:SupabaseUrl = Get-EnvValue "SUPABASE_URL"
$Global:SupabaseKey = Get-EnvValue "SUPABASE_KEY"
$Global:CloudNodeStatus = "OFFLINE"
$Global:CloudNodeAgeSec = -1
$Global:CloudBridgeStatus = "OFFLINE"
$Global:CloudBridgeAgeSec = -1
$Global:LastCloudUpdate = 0
$Global:LastLocalUpdate = 0
$Global:BridgeStatus = "OFFLINE"
$Global:CloudServices = $null
$Global:AppSpecs = [ordered]@{
    Reflect = @{ Port = 3000; Path = 'apps\reflect' }
    Nexus   = @{ Port = 3001; Path = 'apps\nexus' }
    Citadel = @{ Port = 3005; Path = 'apps\citadel' }
    Rocket  = @{ Port = 4000; Path = 'apps\rocket-command' }
    Ghost   = @{ Port = 5173; Path = 'apps\ghost-command' }
}

if ($Global:LauncherCloudOnly) {
    $Global:CloudMode = $true
    Set-EnvValue -key 'MATRIX_CLOUD_MODE' -value 'true'
    Set-EnvValue -key 'MATRIX_ALLOW_LOCAL_SENTINEL' -value '0'
    Set-EnvValue -key 'MATRIX_ALLOW_LOCAL_RUNNER' -value '0'
}

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
        $uri = "$($Global:SupabaseUrl)/rest/v1/matrix_instances?environment=eq.production&select=instance_name,status,last_heartbeat&order=last_heartbeat.desc&limit=1"
        $headers = @{ "apikey" = $Global:SupabaseKey; "Authorization" = "Bearer $($Global:SupabaseKey)" }
        $res = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get

        $row = $null
        if ($res -is [System.Array]) {
            if ($res.Count -gt 0) { $row = $res[0] }
        } else {
            $row = $res
        }

        if ($row -and $row.last_heartbeat) {
            $last = [DateTime]::Parse($row.last_heartbeat).ToUniversalTime()
            $diff = ([DateTime]::UtcNow - $last).TotalSeconds
            $Global:CloudNodeAgeSec = [int]$diff
            if ($diff -lt 300) { $Global:CloudNodeStatus = "ONLINE " }
            elseif ($diff -lt 1800) { $Global:CloudNodeStatus = "STALE  " }
            else { $Global:CloudNodeStatus = "OFFLINE" }
        }
        else {
            $Global:CloudNodeStatus = "VACANT "
            $Global:CloudNodeAgeSec = -1
        }

        # --- Fetch latest bridge heartbeat snapshot (always) ---
        $Global:CloudBridgeStatus = "OFFLINE"
        $Global:CloudBridgeAgeSec = -1
        $hbUri = "$($Global:SupabaseUrl)/rest/v1/ghost_bridge?command=eq.sys:heartbeat&select=output,created_at,source&order=created_at.desc&limit=1"
        $hbRes = Invoke-RestMethod -Uri $hbUri -Headers $headers -Method Get
        if ($hbRes -and $hbRes.Count -gt 0) {
            $hbRow = $hbRes[0]
            if ($hbRow.created_at) {
                $hbLast = [DateTime]::Parse($hbRow.created_at).ToUniversalTime()
                $hbDiff = ([DateTime]::UtcNow - $hbLast).TotalSeconds
                $Global:CloudBridgeAgeSec = [int]$hbDiff
                if ($hbDiff -lt 120) { $Global:CloudBridgeStatus = "ACTIVE " }
                elseif ($hbDiff -lt 600) { $Global:CloudBridgeStatus = "STALE  " }
                else { $Global:CloudBridgeStatus = "OFFLINE" }
            }
            try {
                $json = $hbRow.output | ConvertFrom-Json
                $Global:CloudServices = $json.services
            }
            catch { $Global:CloudServices = $null }
        }
        else {
            # Fallback: if cloud node is alive but bridge heartbeat row is missing,
            # expose bridge as stale to avoid blocking command dispatch.
            if ($Global:CloudNodeStatus -match "ONLINE|STALE") {
                $Global:CloudBridgeStatus = "STALE  "
                if ($Global:CloudNodeAgeSec -ge 0) {
                    $Global:CloudBridgeAgeSec = $Global:CloudNodeAgeSec
                }
            }
            $Global:CloudServices = $null
        }

    }
    catch {
        $Global:CloudNodeStatus = "ERROR  "
        $Global:CloudNodeAgeSec = -1
        $Global:CloudBridgeStatus = "OFFLINE"
        $Global:CloudBridgeAgeSec = -1
        $Global:CloudServices = $null
    }
    $Global:LastCloudUpdate = $nowTicks
}

function Send-CloudCommand {
    param([string]$cmd)
    if (-not $Global:CloudMode) {
        Write-Host "  [CLOUD] Cloud mode is OFF. Press [M] to enable." -ForegroundColor Yellow
        return
    }
    if (-not $Global:SupabaseUrl -or -not $Global:SupabaseKey) {
        Write-Host "  [CLOUD] Missing SUPABASE_URL/SUPABASE_KEY." -ForegroundColor Red
        return
    }
    Get-CloudStatus
    if ($cmd -eq 'sys:ignite') { $cmd = 'sys:cloud_ignite' }
    elseif ($cmd -eq 'sys:kill_all') { $cmd = 'sys:cloud_kill' }
    elseif ($cmd -match '^sys:(start|stop|restart)_(.+)$' -and $cmd -notmatch '^sys:cloud_') {
        $cmd = "sys:cloud_$($matches[1])_$($matches[2])"
    }
    $isBootstrap = @('sys:start_runner', 'sys:start_sentinel', 'sys:ignite', 'sys:cloud_ignite') -contains $cmd
    if (($Global:CloudBridgeStatus -notmatch "ACTIVE|STALE") -and $isBootstrap) {
        Write-Host "  [CLOUD] Heartbeat offline, queueing bootstrap command: $cmd" -ForegroundColor Yellow
    }
    if (($Global:CloudBridgeStatus -notmatch "ACTIVE|STALE") -and -not $isBootstrap) {
        Write-Host "  [CLOUD] Heartbeat offline. Queueing command anyway: $cmd" -ForegroundColor Yellow
    }
    
    $uri = "$($Global:SupabaseUrl)/rest/v1/ghost_bridge"
    $headers = @{ "apikey" = $Global:SupabaseKey; "Authorization" = "Bearer $($Global:SupabaseKey)"; "Content-Type" = "application/json"; "Prefer" = "return=minimal" }
    $body = @{ "command" = $cmd; "status" = "pending"; "source" = "cli_hub_cloud" } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $body
        Update-OptimisticCloudState -cmd $cmd
        $Global:CloudBridgeStatus = "ACTIVE "
        $Global:CloudBridgeAgeSec = 0
        $Global:LastCloudUpdate = 0
        Write-Host "  [SHADOW] Broadcast: $cmd sent." -ForegroundColor Cyan
    }
    catch { }
}

function Set-CloudServiceState {
    param([string]$ServiceName, [string]$State)
    if (-not $Global:CloudServices) {
        $Global:CloudServices = [PSCustomObject]@{}
    }
    if ($Global:CloudServices.PSObject.Properties.Name -contains $ServiceName) {
        $Global:CloudServices.$ServiceName = $State
    } else {
        $Global:CloudServices | Add-Member -NotePropertyName $ServiceName -NotePropertyValue $State
    }
}

function Update-OptimisticCloudState {
    param([string]$cmd)
    switch ($cmd) {
        "sys:ignite" {
            foreach ($svc in @('reflect', 'nexus', 'ghost', 'rocket', 'citadel', 'runner', 'sentinel', 'gate')) {
                Set-CloudServiceState -ServiceName $svc -State 'online'
            }
        }
        "sys:cloud_ignite" {
            foreach ($svc in @('reflect', 'nexus', 'ghost', 'rocket', 'citadel', 'runner', 'sentinel', 'gate')) {
                Set-CloudServiceState -ServiceName $svc -State 'online'
            }
        }
        "sys:kill_all" {
            foreach ($svc in @('reflect', 'nexus', 'ghost', 'rocket', 'citadel', 'runner', 'sentinel', 'gate')) {
                Set-CloudServiceState -ServiceName $svc -State 'offline'
            }
        }
        "sys:cloud_kill" {
            foreach ($svc in @('reflect', 'nexus', 'ghost', 'rocket', 'citadel', 'runner', 'sentinel', 'gate')) {
                Set-CloudServiceState -ServiceName $svc -State 'offline'
            }
        }
        default {
            if ($cmd -match '^sys:start_(.+)$') {
                Set-CloudServiceState -ServiceName $matches[1].ToLower() -State 'online'
            } elseif ($cmd -match '^sys:stop_(.+)$') {
                Set-CloudServiceState -ServiceName $matches[1].ToLower() -State 'offline'
            }
        }
    }
}

function Get-LocalPortStatus {
    param([int]$Port)
    try {
        return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
    }
    catch {
        return $false
    }
}

function Invoke-CloudDoctor {
    Write-Host ""
    Write-Host "  [CLOUD DOCTOR]" -ForegroundColor Cyan
    Write-Host "  ---------------------------------------------------------------" -ForegroundColor DarkCyan

    if (-not $Global:CloudMode) {
        Write-Host "  Cloud mode: OFF" -ForegroundColor Yellow
        Write-Host "  Fix: run 'matrix.bat cloud-on' or press [M] in hub." -ForegroundColor DarkGray
    } else {
        Write-Host "  Cloud mode: ON" -ForegroundColor Green
    }

    if (-not $Global:SupabaseUrl -or -not $Global:SupabaseKey) {
        Write-Host "  Supabase config: MISSING" -ForegroundColor Red
        Write-Host "  Fix: set SUPABASE_URL and SUPABASE_KEY in .env." -ForegroundColor DarkGray
        return
    }
    Write-Host "  Supabase config: OK" -ForegroundColor Green

    $headers = @{ "apikey" = $Global:SupabaseKey; "Authorization" = "Bearer $($Global:SupabaseKey)" }

    try {
        $instUri = "$($Global:SupabaseUrl)/rest/v1/matrix_instances?environment=eq.production&select=instance_name,status,last_heartbeat&order=last_heartbeat.desc&limit=1"
        $inst = Invoke-RestMethod -Uri $instUri -Headers $headers -Method Get
        $instRow = if ($inst -is [System.Array]) { if ($inst.Count -gt 0) { $inst[0] } else { $null } } else { $inst }
        if ($instRow -and $instRow.last_heartbeat) {
            $age = [int](([DateTime]::UtcNow - ([DateTime]::Parse($instRow.last_heartbeat).ToUniversalTime())).TotalSeconds)
            $statusColor = if ($age -lt 300) { "Green" } elseif ($age -lt 1800) { "Yellow" } else { "Red" }
            Write-Host "  matrix_instances latest: $($instRow.instance_name) | age=${age}s | status=$($instRow.status)" -ForegroundColor $statusColor
        } else {
            Write-Host "  matrix_instances latest: none" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  matrix_instances query failed." -ForegroundColor Red
    }

    try {
        $hbUri = "$($Global:SupabaseUrl)/rest/v1/ghost_bridge?command=eq.sys:heartbeat&select=source,created_at&order=created_at.desc&limit=1"
        $hb = Invoke-RestMethod -Uri $hbUri -Headers $headers -Method Get
        $hbRow = if ($hb -is [System.Array]) { if ($hb.Count -gt 0) { $hb[0] } else { $null } } else { $hb }
        if ($hbRow -and $hbRow.created_at) {
            $hbAge = [int](([DateTime]::UtcNow - ([DateTime]::Parse($hbRow.created_at).ToUniversalTime())).TotalSeconds)
            $hbColor = if ($hbAge -lt 120) { "Green" } elseif ($hbAge -lt 600) { "Yellow" } else { "Red" }
            Write-Host "  ghost_bridge heartbeat: source=$($hbRow.source) | age=${hbAge}s" -ForegroundColor $hbColor
        } else {
            Write-Host "  ghost_bridge heartbeat: none" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ghost_bridge heartbeat query failed." -ForegroundColor Red
    }

    try {
        $pendingUri = "$($Global:SupabaseUrl)/rest/v1/ghost_bridge?select=id&source=eq.cli_hub_cloud&status=eq.pending"
        $pending = Invoke-RestMethod -Uri $pendingUri -Headers $headers -Method Get
        $count = 0
        if ($pending -is [System.Array]) { $count = $pending.Count } elseif ($pending) { $count = 1 }
        $pColor = if ($count -eq 0) { "Green" } elseif ($count -lt 20) { "Yellow" } else { "Red" }
        Write-Host "  Pending cloud commands: $count" -ForegroundColor $pColor
    }
    catch {
        Write-Host "  Pending queue query failed." -ForegroundColor Red
    }

    Write-Host "  ---------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "  Recovery checklist:" -ForegroundColor White
    Write-Host "  1) Ensure remote Sentinel/Runner is running and posting sys:heartbeat." -ForegroundColor DarkGray
    Write-Host "  2) If heartbeat age is high, restart remote node service." -ForegroundColor DarkGray
    Write-Host "  3) After heartbeat is fresh (<300s), retry cloud commands." -ForegroundColor DarkGray
    Write-Host ""
}

function Invoke-CloudRecover {
    Write-Host ""
    Write-Host "  [CLOUD RECOVER]" -ForegroundColor Cyan
    Write-Host "  ---------------------------------------------------------------" -ForegroundColor DarkCyan

    if (-not $Global:CloudMode) {
        $Global:CloudMode = $true
        Set-EnvValue -key 'MATRIX_CLOUD_MODE' -value 'true'
        Write-Host "  Cloud mode was OFF. Switched to ON." -ForegroundColor Yellow
    }

    if (-not $Global:SupabaseUrl -or -not $Global:SupabaseKey) {
        Write-Host "  Supabase config missing. Cannot recover." -ForegroundColor Red
        return
    }

    $headers = @{
        "apikey" = $Global:SupabaseKey
        "Authorization" = "Bearer $($Global:SupabaseKey)"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    }

    try {
        $qUri = "$($Global:SupabaseUrl)/rest/v1/ghost_bridge?select=id,source,status&status=eq.pending&source=in.(cli_hub,cli_hub_cloud)"
        $pendingRows = Invoke-RestMethod -Uri $qUri -Headers $headers -Method Get
        $pendingCount = 0
        if ($pendingRows -is [System.Array]) { $pendingCount = $pendingRows.Count } elseif ($pendingRows) { $pendingCount = 1 }
        Write-Host "  Pending queued commands found: $pendingCount" -ForegroundColor DarkGray

        if ($pendingCount -gt 0) {
            $dUri = "$($Global:SupabaseUrl)/rest/v1/ghost_bridge?status=eq.pending&source=in.(cli_hub,cli_hub_cloud)"
            $deleted = Invoke-RestMethod -Uri $dUri -Headers $headers -Method Delete
            $deletedCount = 0
            if ($deleted -is [System.Array]) { $deletedCount = $deleted.Count } elseif ($deleted) { $deletedCount = 1 }
            Write-Host "  Cleared stale pending commands: $deletedCount" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  Queue cleanup failed; continuing bootstrap anyway." -ForegroundColor Yellow
    }

    Write-Host "  Dispatching cloud bootstrap sequence..." -ForegroundColor Cyan
    Send-CloudCommand "sys:cloud_ignite"

    Write-Host "  Recover sequence sent. Run 'matrix.bat cloud-doctor' in 15-30s." -ForegroundColor Green
    Write-Host ""
}

function Invoke-CloudPreflight {
    param(
        [switch]$Recover,
        [switch]$Dispatch,
        [switch]$SkipGithub
    )
    $scriptPath = Join-Path $matrixRoot "scripts\tools\cloud_preflight.cjs"
    if (-not (Test-Path $scriptPath)) {
        Write-Host "  [CLOUD] Missing script: $scriptPath" -ForegroundColor Red
        return
    }

    $args = @($scriptPath)
    if ($Recover) { $args += '--recover' }
    if ($Dispatch) { $args += '--dispatch' }
    if ($SkipGithub) { $args += '--skip-github' }

    Write-Host "  [CLOUD] Running preflight..." -ForegroundColor Cyan
    & node @args
}

function Stop-LocalPort {
    param([int]$Port, [string]$Name)
    $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if (-not $conns) {
        Write-Host "  [LOCAL] $Name already offline." -ForegroundColor DarkGray
        return
    }
    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 500
    Write-Host "  [LOCAL] $Name stopped." -ForegroundColor Yellow
}

function Start-LocalApp {
    param([string]$Name)
    $spec = $Global:AppSpecs[$Name]
    if (-not $spec) { return }
    $port = [int]$spec.Port
    if (Get-LocalPortStatus -Port $port) {
        Write-Host "  [LOCAL] $Name already online on :$port." -ForegroundColor DarkGray
        return
    }
    $cwd = Join-Path $matrixRoot $spec.Path
    if (-not (Test-Path $cwd)) {
        Write-Host "  [LOCAL] App path missing: $cwd" -ForegroundColor Red
        return
    }
    $logDir = Join-Path $matrixRoot 'logs'
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
    $outLog = Join-Path $logDir ("{0}_out.log" -f $Name.ToLower())
    $errLog = Join-Path $logDir ("{0}_err.log" -f $Name.ToLower())
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/d', '/s', '/c', 'npm run dev' -WorkingDirectory $cwd -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog | Out-Null
    Write-Host "  [LOCAL] Starting $Name on :$port..." -ForegroundColor Cyan
}

function Toggle-LocalApp {
    param([string]$Name)
    $spec = $Global:AppSpecs[$Name]
    if (-not $spec) { return }
    $port = [int]$spec.Port
    if (Get-LocalPortStatus -Port $port) {
        Stop-LocalPort -Port $port -Name $Name
    }
    else {
        Start-LocalApp -Name $Name
    }
}

function Toggle-CloudApp {
    param([string]$Name)
    $key = $Name.ToLower()
    $isOnline = $false
    if ($Global:CloudServices -and $Global:CloudServices.$key -eq 'online') { $isOnline = $true }
    if ($isOnline) {
        Send-CloudCommand ("sys:stop_{0}" -f $key)
    }
    else {
        Send-CloudCommand ("sys:start_{0}" -f $key)
    }
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

    $gbCld = $Global:CloudBridgeStatus
    $cGbCld = if ($gbCld -match "ACTIVE") { "Green" } elseif ($gbCld -match "STALE") { "Yellow" } else { "DarkGray" }

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
    if ($Global:CloudNodeAgeSec -ge 0) {
        Write-Host "  Cloud node heartbeat age: $($Global:CloudNodeAgeSec)s" -ForegroundColor DarkGray
    }
    if ($Global:CloudBridgeAgeSec -ge 0) {
        Write-Host "  Cloud bridge heartbeat age: $($Global:CloudBridgeAgeSec)s" -ForegroundColor DarkGray
    }
    Write-Host ""

    # Microservices Map
    $Apps = @(
        @{ Name = "Reflect"; Port = 3000 },
        @{ Name = "Nexus"; Port = 3001 },
        @{ Name = "Citadel"; Port = 3005 },
        @{ Name = "Rocket"; Port = 4000 },
        @{ Name = "Ghost"; Port = 5173 }
    )

    $cloudHotkeys = @('Q', 'W', 'E', 'R', 'T')
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
        Write-Host "[$($cloudHotkeys[$i])] $rightPad [$cStat]" -ForegroundColor $cCol
    }

    Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "  GLOBAL COMMANDS" -ForegroundColor Cyan
    $cloudModeText = if ($Global:CloudMode) { "ON" } else { "OFF" }
    $cloudModeColor = if ($Global:CloudMode) { "Green" } else { "Yellow" }
    Write-Host "    [M] CLOUD LINK: " -NoNewline
    Write-Host "LOCKED ON" -ForegroundColor Green
    Write-Host "    [I] IGNITE ALL CLOUD               [O] IGNITE ALL CLOUD"
    Write-Host "    [K] STOP LOCAL PROCESSES           [L] STOP ALL CLOUD"
    Write-Host "    [U] UPDATE CLOUD APPS              [V] VIEW EVENT LOGS"
    Write-Host "    [C] CLOUD DOCTOR"
    Write-Host "    [B] CLOUD PREFLIGHT                [N] PREFLIGHT+RECOVER"
    Write-Host "    [Y] CLOUD RECOVER"
    Write-Host "    [X] EXIT HUB"
    Write-Host "  ----------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "    Press 1-5 or Q-T to toggle CLOUD apps. Local starts are disabled." -ForegroundColor DarkGray
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
            Write-Host "  [CLOUD-ONLY] Local daemon start is disabled. Stopping local Matrix processes..." -ForegroundColor Yellow
            $stopScript = Join-Path $matrixRoot "scripts\tools\stop_local_matrix_services.ps1"
            if (Test-Path $stopScript) {
                Start-Process "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$stopScript`"" -WindowStyle Hidden -Wait
            }
            Start-Sleep -Seconds 1
        }
        "P" {
            Send-CloudCommand "sys:start_sentinel"
            Start-Sleep -Milliseconds 400
            Send-CloudCommand "sys:start_runner"
            Start-Sleep -Seconds 1
        }

        # 1-5 mapped to cloud toggles in cloud-only launcher mode
        "1" { Toggle-CloudApp -Name 'Reflect'; Start-Sleep -Seconds 1 }
        "2" { Toggle-CloudApp -Name 'Nexus'; Start-Sleep -Seconds 1 }
        "3" { Toggle-CloudApp -Name 'Citadel'; Start-Sleep -Seconds 1 }
        "4" { Toggle-CloudApp -Name 'Rocket'; Start-Sleep -Seconds 1 }
        "5" { Toggle-CloudApp -Name 'Ghost'; Start-Sleep -Seconds 1 }

        # CLOUD TARGETS (Q-T): cloud toggles
        "Q" { Toggle-CloudApp -Name 'Reflect'; Start-Sleep -Seconds 1 }
        "W" { Toggle-CloudApp -Name 'Nexus'; Start-Sleep -Seconds 1 }
        "E" { Toggle-CloudApp -Name 'Citadel'; Start-Sleep -Seconds 1 }
        "R" { Toggle-CloudApp -Name 'Rocket'; Start-Sleep -Seconds 1 }
        "T" { Toggle-CloudApp -Name 'Ghost'; Start-Sleep -Seconds 1 }

        # GLOBAL ACTION MACROS
        "I" {
            Write-Host "  [*] Igniting Cloud Systems..." -ForegroundColor Cyan
            Send-CloudCommand "sys:cloud_ignite"
            Start-Sleep -Seconds 2
        }
        "K" {
            Write-Host "  [*] Stopping local Matrix processes..." -ForegroundColor Yellow
            $stopScript = Join-Path $matrixRoot "scripts\tools\stop_local_matrix_services.ps1"
            if (Test-Path $stopScript) {
                Start-Process "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$stopScript`"" -WindowStyle Hidden -Wait
            }
            Start-Sleep -Seconds 2
        }
        "O" {
            Write-Host "  [*] Sending IGNITE signal to Cloud Servers..." -ForegroundColor Cyan
            Send-CloudCommand "sys:cloud_ignite"
            Start-Sleep -Seconds 2
        }
        "L" {
            Write-Host "  [*] Sending STOP signal to Cloud Servers..." -ForegroundColor Yellow
            Send-CloudCommand "sys:cloud_kill"
            Start-Sleep -Seconds 2
        }
        "U" {
            Write-Host "  [*] Sending UPDATE signal to Cloud Apps..." -ForegroundColor Green
            Send-CloudCommand "sys:update"
            Start-Sleep -Seconds 2
        }
        "V" { 
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
        "C" {
            Invoke-CloudDoctor
            Read-Host "  Press Enter to continue"
        }
        "B" {
            Invoke-CloudPreflight
            Read-Host "  Press Enter to continue"
        }
        "N" {
            Invoke-CloudPreflight -Recover -SkipGithub
            Read-Host "  Press Enter to continue"
        }
        "Y" {
            Invoke-CloudRecover
            Read-Host "  Press Enter to continue"
        }
        "M" {
            $Global:CloudMode = $true
            Set-EnvValue -key 'MATRIX_CLOUD_MODE' -value 'true'
            Set-EnvValue -key 'MATRIX_ALLOW_LOCAL_SENTINEL' -value '0'
            Set-EnvValue -key 'MATRIX_ALLOW_LOCAL_RUNNER' -value '0'
            Write-Host "  [CLOUD] Cloud link is locked ON." -ForegroundColor Cyan
            Start-Sleep -Milliseconds 800
        }
        "X" { exit }
    }
}

# ============================================================
#  CLI COMMAND MODE
# ============================================================

function Invoke-DirectCommand {
    param([string]$Command, [string]$Target)
    $cmd = $Command.ToLower()
    $tgt = $Target
    $cloudDaemonTarget = $null
    if ($Target) {
        $normalized = $Target.ToLower()
        if ($normalized -eq 'reflect') { $tgt = 'Reflect' }
        if ($normalized -eq 'nexus') { $tgt = 'Nexus' }
        if ($normalized -eq 'citadel') { $tgt = 'Citadel' }
        if ($normalized -eq 'rocket') { $tgt = 'Rocket' }
        if ($normalized -eq 'ghost') { $tgt = 'Ghost' }
        if ($normalized -eq 'sentinel' -or $normalized -eq 'runner') { $cloudDaemonTarget = $normalized }
    }

    switch ($cmd) {
        'status' {
            Update-ActivePorts
            Get-CloudStatus
            Draw-Dashboard
            return $true
        }
        'cloud-on' {
            $Global:CloudMode = $true
            Set-EnvValue -key 'MATRIX_CLOUD_MODE' -value 'true'
            Set-EnvValue -key 'MATRIX_ALLOW_LOCAL_SENTINEL' -value '0'
            Set-EnvValue -key 'MATRIX_ALLOW_LOCAL_RUNNER' -value '0'
            Write-Host '[CLOUD] Enabled for this session.' -ForegroundColor Green
            return $true
        }
        'cloud-off' {
            $Global:CloudMode = $true
            Set-EnvValue -key 'MATRIX_CLOUD_MODE' -value 'true'
            Write-Host '[CLOUD] Cloud-only is enforced from launcher; cannot disable here.' -ForegroundColor Yellow
            return $true
        }
        'start' {
            if ($tgt) { Send-CloudCommand ("sys:cloud_start_{0}" -f $tgt.ToLower()) } else { Invoke-HubCommand 'O' }
            return $true
        }
        'stop' {
            if ($tgt -and $Global:AppSpecs[$tgt]) { Send-CloudCommand ("sys:cloud_stop_{0}" -f $tgt.ToLower()) } else { Invoke-HubCommand 'K' }
            return $true
        }
        'restart' {
            if ($tgt -and $Global:AppSpecs[$tgt]) { Send-CloudCommand ("sys:cloud_restart_{0}" -f $tgt.ToLower()) }
            else { Invoke-HubCommand 'O' }
            return $true
        }
        'cloud-start' {
            if ($cloudDaemonTarget) {
                if ($cloudDaemonTarget -eq 'sentinel') {
                    Send-CloudCommand 'sys:start_sentinel'
                    Start-Sleep -Milliseconds 300
                    Send-CloudCommand 'sys:start_runner'
                }
                if ($cloudDaemonTarget -eq 'runner') { Send-CloudCommand 'sys:start_runner' }
            }
            elseif ($tgt) { Toggle-CloudApp -Name $tgt } else { Invoke-HubCommand 'O' }
            return $true
        }
        'cloud-stop' {
            if ($cloudDaemonTarget) {
                if ($cloudDaemonTarget -eq 'sentinel') { Send-CloudCommand 'sys:stop_sentinel' }
                if ($cloudDaemonTarget -eq 'runner') { Send-CloudCommand 'sys:stop_runner' }
            }
            elseif ($tgt) { Send-CloudCommand ("sys:stop_{0}" -f $tgt.ToLower()) } else { Invoke-HubCommand 'L' }
            return $true
        }
        'cloud-doctor' {
            Invoke-CloudDoctor
            return $true
        }
        'cloud-preflight' {
            Invoke-CloudPreflight
            return $true
        }
        'cloud-preflight-recover' {
            Invoke-CloudPreflight -Recover -SkipGithub
            return $true
        }
        'cloud-recover-auto' {
            Invoke-CloudPreflight -Recover -SkipGithub
            return $true
        }
        'cloud-dispatch-test' {
            Invoke-CloudPreflight -Dispatch
            return $true
        }
        'cloud-recover' {
            Invoke-CloudRecover
            return $true
        }
        default {
            return $false
        }
    }
}

# ============================================================
#  MAIN LOOP
# ============================================================

# direct command mode: matrix.bat status | start [app] | stop [app]
if ($args.Count -gt 0) {
    $ok = Invoke-DirectCommand -Command $args[0] -Target $(if ($args.Count -gt 1) { $args[1] } else { $null })
    if (-not $ok) {
        Write-Host "Unknown command: $($args -join ' ')" -ForegroundColor Red
        Write-Host "Usage: matrix.bat status | start [reflect|nexus|citadel|rocket|ghost] | stop [app] | restart [app] | cloud-on | cloud-off | cloud-start [sentinel|runner|reflect|nexus|citadel|rocket|ghost] | cloud-stop [sentinel|runner|reflect|nexus|citadel|rocket|ghost] | cloud-doctor | cloud-preflight | cloud-preflight-recover | cloud-recover-auto | cloud-dispatch-test | cloud-recover" -ForegroundColor DarkGray
        exit 1
    }
    exit 0
}

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
