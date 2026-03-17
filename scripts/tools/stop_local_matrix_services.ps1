$ErrorActionPreference = "SilentlyContinue"

# --- Kill all Matrix-related processes on known ports ---
$ports = @(3000, 3001, 3005, 3333, 4000, 5173)
foreach ($port in $ports) {
    $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

# --- Kill any node.exe processes running Matrix services ---
$nodeProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Name -eq "node.exe" -and (
            $_.CommandLine -like "*sentinel.cjs*" -or
            $_.CommandLine -like "*ghost-runner.cjs*" -or
            $_.CommandLine -like "*guardian.cjs*" -or
            $_.CommandLine -like "*next* -p 3000*" -or
            $_.CommandLine -like "*next* -p 3001*" -or
            $_.CommandLine -like "*next* -p 3005*" -or
            $_.CommandLine -like "*next* -p 3333*" -or
            $_.CommandLine -like "*next* -p 4000*" -or
            $_.CommandLine -like "*next* -p 5173*" -or
            $_.CommandLine -like "*matrix*sentinel*" -or
            $_.CommandLine -like "*matrix*ghost*" -or
            $_.CommandLine -like "*autopilot*" -or
            $_.CommandLine -like "*self_heal*"
        )
    }

foreach ($proc in $nodeProcs) {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
}

# --- Kill any PM2 daemon processes ---
$pm2Procs = Get-Process -Name "pm2" -ErrorAction SilentlyContinue
foreach ($proc in $pm2Procs) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}

Write-Output "local_matrix_services_stopped"
