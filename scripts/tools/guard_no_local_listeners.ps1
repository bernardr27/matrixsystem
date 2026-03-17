$ErrorActionPreference = 'SilentlyContinue'
$ports = @(3000,3001,3005,3333,4000,5173)
$listening = @()
foreach ($port in $ports) {
  $rows = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($rows) {
    $pids = $rows | Select-Object -ExpandProperty OwningProcess -Unique
    $listening += [PSCustomObject]@{ Port = $port; Pids = ($pids -join ',') }
  }
}

if ($listening.Count -gt 0) {
  Write-Output 'local_listener_guard_failed'
  $listening | ForEach-Object { Write-Output ("port=" + $_.Port + " pids=" + $_.Pids) }
  exit 2
}

Write-Output 'local_listener_guard_ok'
exit 0
