# ═══════════════════════════════════════════════════════════════
#  MATRIX CONTROL v4.0 — Unified launcher (replaces start/stop/control)
#  All services run completely hidden. No CMD popups.
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = 'SilentlyContinue'
$matrixRoot = Split-Path -Parent $PSScriptRoot
if (-not $matrixRoot -or $matrixRoot -eq '') { $matrixRoot = (Get-Item "$PSScriptRoot\..").FullName }
Set-Location $matrixRoot

# ── Helpers ──────────────────────────────────────────────────

function Get-LanIP {
    $addr = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.InterfaceAlias -notmatch 'Loopback' -and
        $_.IPAddress -notmatch '^169\.' -and
        $_.IPAddress -ne '127.0.0.1'
    } | Select-Object -First 1
    if ($addr) { return $addr.IPAddress }
    return $null
}

function Get-ServiceStatus {
    $ports = [ordered]@{ 3000 = 'Reflect'; 3001 = 'Nexus'; 4000 = 'Rocket Command'; 5173 = 'Ghost Command' }
    $online = 0
    $results = @()
    foreach ($port in $ports.Keys) {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        $name = $ports[$port]
        if ($conn) {
            $online++
            $results += "      [ONLINE]  $name  :$port"
        }
        else {
            $results += "      [  --  ]  $name  :$port"
        }
    }
    return @{ Online = $online; Total = $ports.Count; Lines = $results }
}

function Stop-Matrix {
    param([switch]$NoOutput)
    if (-not $NoOutput) {
        Write-Host ''
        Write-Host '  Shutting down...' -ForegroundColor Yellow
    }

    # Kill titled windows
    $titles = @('SENTINEL_GUARD', 'GHOST_RUNNER', 'REFLECT_OS', 'GHOST_OS', 'NEXUS_HUB', 'ROCKET_CMD')
    foreach ($t in $titles) {
        & taskkill /F /FI "WINDOWTITLE eq $t*" /IM cmd.exe 2>&1 | Out-Null
    }

    # Kill hidden background processes we started
    $pidFile = Join-Path $matrixRoot '.matrix_pids'
    if (Test-Path $pidFile) {
        $lines = Get-Content $pidFile
        foreach ($line in $lines) {
            $procId = $line.Trim()
            if ($procId -match '^\d+$') {
                Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
            }
        }
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }

    # Kill remaining node processes on our ports
    foreach ($port in 3000, 3001, 4000, 5173) {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conns) {
            $owning = $conns | ForEach-Object { $_.OwningProcess } | Select-Object -Unique
            foreach ($procId in $owning) {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }

    Start-Sleep -Milliseconds 500
    if (-not $NoOutput) {
        Write-Host '  All systems offline.' -ForegroundColor Green
    }
}

function Start-Matrix {
    Write-Host ''
    Write-Host '  Igniting Matrix...' -ForegroundColor Cyan

    # Clean any stale processes first
    Stop-Matrix -NoOutput
    Start-Sleep -Seconds 1

    $procIds = @()

    # Core services (completely hidden)
    Write-Host '    Sentinel...' -NoNewline
    $proc = Start-Process -FilePath 'node.exe' -ArgumentList 'apps\ghost-command\core\sentinel.cjs' -WorkingDirectory $matrixRoot -WindowStyle Hidden -PassThru
    $procIds += $proc.Id
    Write-Host ' ok' -ForegroundColor Green

    Start-Sleep -Milliseconds 500

    Write-Host '    Ghost Runner...' -NoNewline
    $proc = Start-Process -FilePath 'node.exe' -ArgumentList 'apps\ghost-command\core\ghost-runner.cjs' -WorkingDirectory $matrixRoot -WindowStyle Hidden -PassThru
    $procIds += $proc.Id
    Write-Host ' ok' -ForegroundColor Green

    Start-Sleep -Milliseconds 500

    # App dev servers (completely hidden, logging to files)
    $logDir = Join-Path $matrixRoot 'logs'
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

    if ($env:MATRIX_MODE -eq 'production') {
        # Reflect — PROD or DEV fallback
        if ($env:MATRIX_BUILD_REFLECT -eq '0') {
            Write-Host '    Reflect :3000 (DEV fallback)...' -NoNewline
            $proc = Start-Process -FilePath 'npx.cmd' -ArgumentList 'next', 'dev', '-p', '3000', '-H', '0.0.0.0' -WorkingDirectory (Join-Path $matrixRoot 'apps\reflect') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'reflect_out.log') -RedirectStandardError (Join-Path $logDir 'reflect_err.log')
        }
        else {
            Write-Host '    Reflect (PROD)...' -NoNewline
            $proc = Start-Process -FilePath 'npm.cmd' -ArgumentList 'start' -WorkingDirectory (Join-Path $matrixRoot 'apps\reflect') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'reflect_out.log') -RedirectStandardError (Join-Path $logDir 'reflect_err.log')
        }
        $procIds += $proc.Id
        Write-Host ' ok' -ForegroundColor Green

        # Nexus — PROD or DEV fallback
        if ($env:MATRIX_BUILD_NEXUS -eq '0') {
            Write-Host '    Nexus :3001 (DEV fallback)...' -NoNewline
            $proc = Start-Process -FilePath 'npx.cmd' -ArgumentList 'next', 'dev', '-p', '3001', '-H', '0.0.0.0' -WorkingDirectory (Join-Path $matrixRoot 'apps\nexus') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'nexus_out.log') -RedirectStandardError (Join-Path $logDir 'nexus_err.log')
        }
        else {
            Write-Host '    Nexus (PROD)...' -NoNewline
            $proc = Start-Process -FilePath 'npm.cmd' -ArgumentList 'start' -WorkingDirectory (Join-Path $matrixRoot 'apps\nexus') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'nexus_out.log') -RedirectStandardError (Join-Path $logDir 'nexus_err.log')
        }
        $procIds += $proc.Id
        Write-Host ' ok' -ForegroundColor Green

        # Ghost Cmd — PROD or DEV fallback
        if ($env:MATRIX_BUILD_GHOST -eq '0') {
            Write-Host '    Ghost Command :5173 (DEV fallback)...' -NoNewline
            $proc = Start-Process -FilePath 'npx.cmd' -ArgumentList 'next', 'dev', '-p', '5173', '-H', '0.0.0.0' -WorkingDirectory (Join-Path $matrixRoot 'apps\ghost-command') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'ghost_out.log') -RedirectStandardError (Join-Path $logDir 'ghost_err.log')
        }
        else {
            Write-Host '    Ghost Cmd (PROD)...' -NoNewline
            $proc = Start-Process -FilePath 'npm.cmd' -ArgumentList 'start' -WorkingDirectory (Join-Path $matrixRoot 'apps\ghost-command') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'ghost_out.log') -RedirectStandardError (Join-Path $logDir 'ghost_err.log')
        }
        $procIds += $proc.Id
        Write-Host ' ok' -ForegroundColor Green

        # Rocket Cmd — PROD or DEV fallback
        if ($env:MATRIX_BUILD_ROCKET -eq '0') {
            Write-Host '    Rocket Command :4000 (DEV fallback)...' -NoNewline
            $proc = Start-Process -FilePath 'npx.cmd' -ArgumentList 'next', 'dev', '-p', '4000', '-H', '0.0.0.0' -WorkingDirectory (Join-Path $matrixRoot 'apps\rocket-command') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'rocket_out.log') -RedirectStandardError (Join-Path $logDir 'rocket_err.log')
        }
        else {
            Write-Host '    Rocket Cmd (PROD)...' -NoNewline
            $proc = Start-Process -FilePath 'npm.cmd' -ArgumentList 'start' -WorkingDirectory (Join-Path $matrixRoot 'apps\rocket-command') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'rocket_out.log') -RedirectStandardError (Join-Path $logDir 'rocket_err.log')
        }
        $procIds += $proc.Id
        Write-Host ' ok' -ForegroundColor Green
    }
    else {
        Write-Host '    Reflect :3000...' -NoNewline
        $proc = Start-Process -FilePath 'npx.cmd' -ArgumentList 'next', 'dev', '-p', '3000', '-H', '0.0.0.0' -WorkingDirectory (Join-Path $matrixRoot 'apps\reflect') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'reflect_out.log') -RedirectStandardError (Join-Path $logDir 'reflect_err.log')
        $procIds += $proc.Id
        Write-Host ' ok' -ForegroundColor Green

        Write-Host '    Nexus :3001...' -NoNewline
        $proc = Start-Process -FilePath 'npx.cmd' -ArgumentList 'next', 'dev', '-p', '3001', '-H', '0.0.0.0' -WorkingDirectory (Join-Path $matrixRoot 'apps\nexus') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'nexus_out.log') -RedirectStandardError (Join-Path $logDir 'nexus_err.log')
        $procIds += $proc.Id
        Write-Host ' ok' -ForegroundColor Green

        Write-Host '    Ghost Command :5173...' -NoNewline
        $proc = Start-Process -FilePath 'npx.cmd' -ArgumentList 'next', 'dev', '-p', '5173', '-H', '0.0.0.0' -WorkingDirectory (Join-Path $matrixRoot 'apps\ghost-command') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'ghost_out.log') -RedirectStandardError (Join-Path $logDir 'ghost_err.log')
        $procIds += $proc.Id
        Write-Host ' ok' -ForegroundColor Green

        Write-Host '    Rocket Command :4000...' -NoNewline
        $proc = Start-Process -FilePath 'npx.cmd' -ArgumentList 'next', 'dev', '-p', '4000', '-H', '0.0.0.0' -WorkingDirectory (Join-Path $matrixRoot 'apps\rocket-command') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'rocket_out.log') -RedirectStandardError (Join-Path $logDir 'rocket_err.log')
        $procIds += $proc.Id
        Write-Host ' ok' -ForegroundColor Green
    }

    # Save PIDs for clean shutdown
    $procIds | Out-File -FilePath (Join-Path $matrixRoot '.matrix_pids') -Force

    # Wait for servers to boot
    Write-Host ''
    Write-Host '  Waiting for servers...' -ForegroundColor DarkGray
    Start-Sleep -Seconds 6

    # Status check
    $status = Get-ServiceStatus
    foreach ($line in $status.Lines) { Write-Host $line }

    # Show access URLs
    $ip = Get-LanIP
    Write-Host ''
    Write-Host '  ══════════════════════════════════════════' -ForegroundColor DarkCyan
    Write-Host '   Desktop:' -ForegroundColor White
    Write-Host '     Reflect      http://localhost:3000' -ForegroundColor DarkGray
    Write-Host '     Nexus        http://localhost:3001' -ForegroundColor DarkGray
    Write-Host '     Rocket Cmd   http://localhost:4000' -ForegroundColor DarkGray
    Write-Host '     Ghost Cmd    http://localhost:5173' -ForegroundColor DarkGray
    if ($ip) {
        Write-Host ''
        Write-Host '   Mobile (same Wi-Fi):' -ForegroundColor White
        Write-Host "     Reflect      http://${ip}:3000" -ForegroundColor Cyan
        Write-Host "     Nexus        http://${ip}:3001" -ForegroundColor Cyan
        Write-Host "     Rocket Cmd   http://${ip}:4000" -ForegroundColor Cyan
        Write-Host "     Ghost Cmd    http://${ip}:5173" -ForegroundColor Cyan
    }
    Write-Host '  ══════════════════════════════════════════' -ForegroundColor DarkCyan
}

# ── Interactive Menu ─────────────────────────────────────────

function Show-Menu {
    while ($true) {
        Clear-Host
        Write-Host ''
        Write-Host '  ╔══════════════════════════════════════════╗' -ForegroundColor DarkCyan
        Write-Host '  ║       MATRIX CONTROL  v4.0               ║' -ForegroundColor Cyan
        Write-Host '  ╚══════════════════════════════════════════╝' -ForegroundColor DarkCyan
        Write-Host ''

        # Live status
        $status = Get-ServiceStatus
        if ($status.Online -ge 3) {
            Write-Host '   STATUS: ' -NoNewline
            Write-Host 'ONLINE' -ForegroundColor Green -NoNewline
            Write-Host "  $($status.Online)/$($status.Total) services"
        }
        elseif ($status.Online -ge 1) {
            Write-Host '   STATUS: ' -NoNewline
            Write-Host 'PARTIAL' -ForegroundColor Yellow -NoNewline
            Write-Host "  $($status.Online)/$($status.Total) services"
        }
        else {
            Write-Host '   STATUS: ' -NoNewline
            Write-Host 'OFFLINE' -ForegroundColor Red
        }

        foreach ($line in $status.Lines) { Write-Host $line -ForegroundColor DarkGray }
        Write-Host ''
        Write-Host '  ──────────────────────────────────────────' -ForegroundColor DarkGray
        Write-Host '   [1]  START (DEV)   Launch (Dev Mode)' -ForegroundColor White
        Write-Host '   [2]  STOP          Shutdown everything' -ForegroundColor White
        Write-Host '   [3]  RESTART       Stop + Start' -ForegroundColor White
        Write-Host "   [4]  BUILD         (Individual or Full Optimized)" -ForegroundColor Cyan
        Write-Host "   [5]  UPGRADE       (npm install)" -ForegroundColor White
        Write-Host "   [6]  TRIAGE        (System Health)" -ForegroundColor White
        Write-Host "   [7]  INFO          (System Environment)" -ForegroundColor Yellow
        Write-Host "   [8]  CLEAN         (Wipe Build Caches)" -ForegroundColor Red
        Write-Host "   [9]  RALPH         (Autonomous Agent)" -ForegroundColor Yellow
        Write-Host "   [U]  UPDATE AI     (Ollama & Models)" -ForegroundColor Magenta
        Write-Host "   [0]  EXIT" -ForegroundColor DarkGray
        Write-Host '  ──────────────────────────────────────────' -ForegroundColor DarkGray
        Write-Host ''

        $choice = Read-Host "  Enter Query Protocol"
        $choice = $choice.Trim()

        switch ($choice) {
            "1" {
                Start-Matrix
                Write-Host ''
                Read-Host '  Press Enter to continue'
            }
            "2" {
                Stop-Matrix
                Write-Host ''
                Read-Host '  Press Enter to continue'
            }
            "3" {
                Write-Host '  Restarting Matrix...' -ForegroundColor Yellow
                Stop-Matrix
                Start-Sleep -Seconds 2
                Start-Matrix
                Write-Host ''
                Read-Host '  Press Enter to continue'
            }
            "4" {
                Write-Host ''
                Write-Host '  ╔══════════════════════════════════════════╗' -ForegroundColor DarkCyan
                Write-Host '  ║          MATRIX BUILD SYSTEM             ║' -ForegroundColor Cyan
                Write-Host '  ╚══════════════════════════════════════════╝' -ForegroundColor DarkCyan
                Write-Host ''
                Write-Host '   [1] Build ALL (Production Sync)'
                Write-Host '   [2] Build REFLECT ONLY'
                Write-Host '   [3] Build NEXUS ONLY'
                Write-Host '   [4] Build GHOST CMD'
                Write-Host '   [5] Build ROCKET CMD'
                Write-Host ''
                Write-Host '   [0] Back'
                Write-Host ''
                
                $bChoice = Read-Host "  Select Build Target"
                if ($bChoice -eq "0") { continue }

                Stop-Matrix
                $buildResults = @{}

                if ($bChoice -eq "1" -or $bChoice -eq "2") {
                    Write-Host '  Building Reflect...' -NoNewline
                    Set-Location (Join-Path $matrixRoot 'apps\reflect')
                    & npm run build 2>&1 | Out-Null
                    $buildResults['reflect'] = ($LASTEXITCODE -eq 0)
                    Write-Host (if ($buildResults['reflect']) { ' DONE' } else { ' FAILED' }) -ForegroundColor (if ($buildResults['reflect']) { 'Green' } else { 'Red' })
                }

                if ($bChoice -eq "1" -or $bChoice -eq "3") {
                    Write-Host '  Building Nexus...' -NoNewline
                    Set-Location (Join-Path $matrixRoot 'apps\nexus')
                    & npm run build 2>&1 | Out-Null
                    $buildResults['nexus'] = ($LASTEXITCODE -eq 0)
                    Write-Host (if ($buildResults['nexus']) { ' DONE' } else { ' FAILED' }) -ForegroundColor (if ($buildResults['nexus']) { 'Green' } else { 'Red' })
                }

                if ($bChoice -eq "1" -or $bChoice -eq "4") {
                    Write-Host '  Building Ghost Command...' -NoNewline
                    Set-Location (Join-Path $matrixRoot 'apps\ghost-command')
                    & npm run build 2>&1 | Out-Null
                    $buildResults['ghost-command'] = ($LASTEXITCODE -eq 0)
                    Write-Host (if ($buildResults['ghost-command']) { ' DONE' } else { ' FAILED' }) -ForegroundColor (if ($buildResults['ghost-command']) { 'Green' } else { 'Red' })
                }

                if ($bChoice -eq "1" -or $bChoice -eq "5") {
                    Write-Host '  Building Rocket Command...' -NoNewline
                    Set-Location (Join-Path $matrixRoot 'apps\rocket-command')
                    & npm run build 2>&1 | Out-Null
                    $buildResults['rocket-command'] = ($LASTEXITCODE -eq 0)
                    Write-Host (if ($buildResults['rocket-command']) { ' DONE' } else { ' FAILED' }) -ForegroundColor (if ($buildResults['rocket-command']) { 'Green' } else { 'Red' })
                }

                Set-Location $matrixRoot

                # Summary
                $passed = ($buildResults.Values | Where-Object { $_ -eq $true }).Count
                $failed = ($buildResults.Values | Where-Object { $_ -eq $false }).Count
                Write-Host ''
                Write-Host "  BUILD SUMMARY: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { 'Green' } else { 'Yellow' })

                if ($passed -gt 0) {
                    $startNow = Read-Host '  Start in OPTIMIZED mode now? (y/n)'
                    if ($startNow.Trim() -match '^[Yy]') {
                        $env:MATRIX_MODE = 'production'
                        $env:MATRIX_BUILD_REFLECT = if ($buildResults['reflect']) { '1' } else { '0' }
                        $env:MATRIX_BUILD_NEXUS = if ($buildResults['nexus']) { '1' } else { '0' }
                        $env:MATRIX_BUILD_GHOST = if ($buildResults['ghost-command']) { '1' } else { '0' }
                        $env:MATRIX_BUILD_ROCKET = if ($buildResults['rocket-command']) { '1' } else { '0' }
                        Start-Matrix
                        $env:MATRIX_MODE = $null
                        $env:MATRIX_BUILD_REFLECT = $null
                        $env:MATRIX_BUILD_NEXUS = $null
                        $env:MATRIX_BUILD_GHOST = $null
                        $env:MATRIX_BUILD_ROCKET = $null
                    }
                }
                Write-Host ''
                Read-Host '  Press Enter to continue'
            }
            "5" { 
                Write-Host "Upgrading Matrix Neural Pathways..." -ForegroundColor Cyan
                npm install
                Set-Location "apps\reflect"; npm install; Set-Location ..\..
                Set-Location "apps\nexus"; npm install; Set-Location ..\..
                Set-Location "apps\ghost-command"; npm install; Set-Location ..\..
                Set-Location "apps\rocket-command"; npm install; Set-Location ..\..
                Write-Host "Upgrade Complete." -ForegroundColor Green
                Pause
            }
            "6" { Start-Process "node" -ArgumentList "apps\ghost-command\core\triage.cjs --interactive" }
            "7" { 
                Clear-Host
                Write-Host ""
                Write-Host "  [MATRIX] SYSTEM INFORMATION" -ForegroundColor Cyan
                Write-Host "  ═══════════════════════════"
                $os = Get-CimInstance Win32_OperatingSystem
                $cpu = Get-CimInstance Win32_Processor
                $mem = [Math]::Round(($os.TotalVisibleMemorySize / 1MB), 2)
                $free = [Math]::Round(($os.FreePhysicalMemory / 1MB), 2)
                
                Write-Host "  OS:      $($os.Caption) ($($os.OSArchitecture))"
                Write-Host "  CPU:     $($cpu.Name)"
                Write-Host "  RAM:     $($mem - $free)GB / $($mem)GB Used"
                Write-Host "  IP:      $(Get-LanIP)"
                Write-Host "  ROOT:    $matrixRoot"
                Write-Host ""
                Write-Host "  PORT STATUS:"
                $status = Get-ServiceStatus
                foreach ($line in $status.Lines) { Write-Host $line }
                Write-Host ""
                Read-Host "  Press Enter to continue"
            }
            "8" {
                Write-Host ""
                Write-Host "  [MATRIX] DEEP CLEAN INITIATED" -ForegroundColor Red
                Write-Host "  This will wipe all .next and node_modules folders." -ForegroundColor DarkGray
                $confirm = Read-Host "  Are you absolutely sure? (y/n)"
                if ($confirm -match '^[Yy]') {
                    Stop-Matrix
                    Write-Host "  Wiping caches..."
                    foreach ($app in "reflect", "nexus", "ghost-command", "rocket-command") {
                        $path = Join-Path $matrixRoot "apps\$app"
                        if (Test-Path "$path\.next") { Remove-Item "$path\.next" -Recurse -Force }
                        if (Test-Path "$path\node_modules") { Remove-Item "$path\node_modules" -Recurse -Force }
                        Write-Host "    $app cleaned."
                    }
                    Write-Host "  System Purged. Run [5] UPGRADE to reinstall." -ForegroundColor Green
                }
                Read-Host "  Press Enter to continue"
            }
            "9" {
                Write-Host "Summoning Ralph..." -ForegroundColor Yellow
                Start-Process "node" -ArgumentList "apps\ralph\ralph.mjs"
            }
            "u" {
                Start-Process "launchers\update_ai.bat"
            }
            "U" {
                Start-Process "launchers\update_ai.bat"
            }
            "0" { return }
            default { Write-Host "Invalid Protocol." -ForegroundColor Red }
        }
    }
}

# ── Entry Point ──────────────────────────────────────────────

# Support direct commands: matrix start | matrix stop | matrix restart | matrix status
if ($args.Count -gt 0) {
    $command = $args[0].ToString().ToLower()
    switch ($command) {
        'start' { Start-Matrix }
        'stop' { Stop-Matrix }
        'restart' { Stop-Matrix; Start-Sleep 2; Start-Matrix }
        'info' {
            $ip = Get-LanIP
            Write-Host "  MATRIX STATUS [$(Get-Date)]" -ForegroundColor Cyan
            Write-Host "  IP: $ip"
            $s = Get-ServiceStatus
            foreach ($line in $s.Lines) { Write-Host $line }
        }
        'clean' {
            Write-Host "  Run matrix clean from the interactive menu for safety." -ForegroundColor Yellow
        }
        'status' {
            $s = Get-ServiceStatus
            foreach ($line in $s.Lines) { Write-Host $line }
        }
        default { Write-Host "Unknown command: $command" }
    }
    exit
}

# No args = interactive menu
Show-Menu
