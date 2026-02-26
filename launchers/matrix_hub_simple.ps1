# MATRIX CONTROL SYSTEM v6.0
$ErrorActionPreference = 'SilentlyContinue'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Get-PortStatus {
    param([int]$port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        return $connection -ne $null
    } catch {
        return $false
    }
}

function Wait-ForPorts {
    param([int[]]$ports, [int]$timeout = 60)
    $startTime = Get-Date
    $allOnline = $false
    
    while (-not $allOnline -and ((Get-Date) - $startTime).TotalSeconds -lt $timeout) {
        $allOnline = $true
        foreach ($port in $ports) {
            if (-not (Get-PortStatus $port)) {
                $allOnline = $false
                break
            }
        }
        
        if (-not $allOnline) {
            Start-Sleep -Milliseconds 500
        }
    }
    
    return $allOnline
}

Write-Host ""
Write-Host "[MATRIX SYSTEM CONTROL HUB v6.1]" -ForegroundColor Cyan
Write-Host "The One Launcher to Rule Them All" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "CORE OPERATIONS" -ForegroundColor Green
Write-Host "[1] SILENT START   - Start all apps in background" -ForegroundColor DarkGray
Write-Host "[2] VISIBLE START  - Start apps with debug windows" -ForegroundColor DarkGray
Write-Host "[3] SYSTEM STOP    - Kill all running services" -ForegroundColor DarkGray
Write-Host ""
Write-Host "ADVANCED TOOLS" -ForegroundColor Magenta
Write-Host "[4] AI MANAGER     - Manage Ollama and Ralph agents" -ForegroundColor DarkGray
Write-Host "[5] DEPLOYMENT     - Deploy to Vercel and Supabase" -ForegroundColor DarkGray
Write-Host "[6] MAINTENANCE    - Backup, clean, and repair system" -ForegroundColor DarkGray
Write-Host ""
Write-Host "LIVE CONTROLS" -ForegroundColor Yellow
Write-Host "[L] VIEW LOGS      - Stream real-time system logs" -ForegroundColor DarkGray
Write-Host "[D] DIAGNOSTICS    - Run system health diagnostics" -ForegroundColor DarkGray
Write-Host "[K] KILL PROCESS   - Force stop specific service" -ForegroundColor DarkGray
Write-Host "[Q] QUIT HUB       - Exit control panel" -ForegroundColor DarkGray
Write-Host ""

while ($true) {
    $choice = Read-Host "Enter command"
    
    switch ($choice.ToUpper()) {
        "1" {
            Write-Host "[*] Starting apps in background..." -ForegroundColor Green
            cmd /c "launchers\launch_silent.bat" 2>$null
            Write-Host "[*] Waiting for services to come online..." -ForegroundColor Yellow
            
            $online = Wait-ForPorts @(3000, 3001, 5173) -timeout 30
            
            if ($online) {
                Write-Host "OK: All services ONLINE" -ForegroundColor Green
                Write-Host "    Reflect:      http://localhost:3000 (ONLINE)" -ForegroundColor Green
                Write-Host "    Nexus:        http://localhost:3001 (ONLINE)" -ForegroundColor Green
                Write-Host "    Ghost Cmd:    http://localhost:5173 (ONLINE)" -ForegroundColor Green
            } else {
                Write-Host "!! Services started but not all ports detected yet" -ForegroundColor Yellow
                Write-Host "   They may still be initializing..." -ForegroundColor DarkGray
            }
        }
        "2" {
            Write-Host "[*] Starting apps in visible mode..." -ForegroundColor Yellow
            Write-Host "http://localhost:3000 (Reflect)" -ForegroundColor Cyan
            Write-Host "http://localhost:3001 (Nexus)" -ForegroundColor Cyan
            Write-Host "http://localhost:5173 (Ghost Command)" -ForegroundColor Cyan
            Start-Process "launchers\start.bat"
        }
        "3" {
            Write-Host "[*] Stopping all services..." -ForegroundColor Red
            cmd /c "launchers\stop.bat" 2>$null
            Write-Host "OK: All services stopped." -ForegroundColor Green
        }
        "4" {
            Write-Host "AI MANAGER" -ForegroundColor Magenta
            Write-Host "[1] Update Ollama" -ForegroundColor Cyan
            Write-Host "[2] Launch Ralph" -ForegroundColor Cyan
            $ai = Read-Host "Select"
            if ($ai -eq "1") { 
                Write-Host "[*] Updating Ollama..." -ForegroundColor Yellow
                Start-Process "launchers\update_ai.bat" -Wait 
            }
            if ($ai -eq "2") { 
                Write-Host "[*] Launching Ralph..." -ForegroundColor Cyan
                Start-Process "node" -ArgumentList "apps\ghost-command\core\ralph.cjs" 
            }
        }
        "5" {
            Write-Host "[*] Deploying to Vercel and Supabase..." -ForegroundColor Yellow
            Start-Process "launchers\deploy.bat"
        }
        "6" {
            Write-Host "MAINTENANCE" -ForegroundColor White
            Write-Host "[1] Backup  [2] Clean  [3] Triage" -ForegroundColor Cyan
            $maint = Read-Host "Select"
            if ($maint -eq "1") { 
                Write-Host "[*] Backing up system..." -ForegroundColor Green
                Start-Process "launchers\backup.bat" -Wait 
            }
            if ($maint -eq "2") { 
                Write-Host "[*] Cleaning files..." -ForegroundColor Yellow
                powershell -ExecutionPolicy Bypass -File scripts\clean_all.ps1
            }
            if ($maint -eq "3") { 
                Write-Host "[*] Running triage..." -ForegroundColor Cyan
                Start-Process "node" -ArgumentList "apps\ghost-command\core\triage.cjs --interactive" 
            }
        }
        "L" {
            Write-Host "[*] Opening logs..." -ForegroundColor Green
            Start-Process "notepad" -ArgumentList "logs\matrix_session.log"
        }
        "D" {
            Write-Host "[*] Running diagnostics..." -ForegroundColor Yellow
            Start-Process "launchers\diagnostics.bat" -Wait
        }
        "K" {
            Write-Host "Kill Process - Enter port number" -ForegroundColor Red
            $p = Read-Host "Port (3000/3001/5173)"
            if ($p) {
                try {
                    $proc = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
                    if ($proc) { 
                        $proc.OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
                        Write-Host "OK: Port $p process terminated." -ForegroundColor Red
                    } else {
                        Write-Host "Port $p not found." -ForegroundColor Yellow
                    }
                } catch {
                    Write-Host "ERROR: $_" -ForegroundColor Red
                }
            }
        }
        "Q" { 
            Write-Host "[*] Exiting Matrix Hub..." -ForegroundColor Yellow
            exit 
        }
        default {
            Write-Host "Invalid command. Try again." -ForegroundColor Red
        }
    }
}
