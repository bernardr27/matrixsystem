param([int]$SkipPid = 0)

# Zombie Purge Protocol v1.1
# Purpose: Deep cleaning of orphaned local dev environments

$TargetPorts = @(3000, 3001, 3005, 4000, 5173, 3334)
$TargetFiles = @("core\ghost-runner.lock", "core\nexus-sentinel.lock", "apps\citadel\.tunnel-url")

Write-Host "--- SHADOW PURGE INITIATED ---" -ForegroundColor Cyan

# 1. Kill processes on target ports
foreach ($Port in $TargetPorts) {
    Write-Host "[PURGE] Scrutinizing Port $Port..." -NoNewline
    $Connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($Connections) {
        $Pids = $Connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($TargetPid in $Pids) {
            try {
                Stop-Process -Id $TargetPid -Force -ErrorAction Stop
                Write-Host " [TERMINATED PID $TargetPid]" -ForegroundColor Red
            }
            catch {
                Write-Host " [BYPASSED PID $TargetPid]" -ForegroundColor Yellow
            }
        }
    }
    else {
        Write-Host " [CLEAR]" -ForegroundColor Green
    }
}

# 2. Kill orphaned Node processes that might be lingering
Write-Host "[PURGE] Hunting Zombie Node Instances..."
$Zombies = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and ($_.CommandLine -like '*sentinel.cjs*' -or $_.CommandLine -like '*ghost-runner.cjs*' -or $_.CommandLine -like '*guardian.cjs*' -or $_.CommandLine -like '*bot.js*' -or $_.CommandLine -like '*next-server*') }
foreach ($Zombie in $Zombies) {
    if ($Zombie.ProcessId -ne $PID -and $Zombie.ProcessId -ne $SkipPid) {
        Write-Host " [PURGING] $($Zombie.CommandLine)" -ForegroundColor Red
        Stop-Process -Id $Zombie.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

# 3. Clear Stale Lockfiles
foreach ($File in $TargetFiles) {
    if (Test-Path $File) {
        $FilePid = Get-Content $File -Raw -ErrorAction SilentlyContinue
        if ($FilePid) {
            $FilePid = $FilePid.Trim()
            if ($FilePid -eq $SkipPid.ToString()) {
                Write-Host "[PURGE] Preserving Active Lock: $File (PID $FilePid)" -ForegroundColor Cyan
                continue
            }
        }
        Write-Host "[PURGE] Removing Stale Lock: $File" -ForegroundColor Yellow
        Remove-Item $File -Force
    }
}

Write-Host "--- ENVIRONMENT PRISTINE ---" -ForegroundColor Cyan
