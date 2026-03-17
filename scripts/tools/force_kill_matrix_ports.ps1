$ErrorActionPreference = "SilentlyContinue"

$ports = @(3000,3001,3005,3333,4000,5173)
foreach ($port in $ports) {
    $rows = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($row in $rows) {
        taskkill /F /PID $row.OwningProcess /T | Out-Null
    }
}

Write-Output "force_kill_complete"
