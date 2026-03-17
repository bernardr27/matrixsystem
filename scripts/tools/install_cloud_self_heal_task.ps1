$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$taskName = "MatrixCloudSelfHeal"
$nodePath = (Get-Command node -ErrorAction Stop).Source
$scriptPath = Join-Path $repoRoot "scripts\tools\cloud_self_heal_daemon.cjs"

if (-not (Test-Path $scriptPath)) {
    throw "Missing script: $scriptPath"
}

$arg = "`"$scriptPath`" --interval-sec=30 --stale-sec=120"
$action = New-ScheduledTaskAction -Execute $nodePath -Argument $arg -WorkingDirectory $repoRoot
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn
$triggerStartup = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew

try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
} catch {}

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($triggerLogon, $triggerStartup) -Settings $settings -Description "Matrix cloud heartbeat auto-recover daemon" | Out-Null
    Start-ScheduledTask -TaskName $taskName
    Write-Host "[OK] Installed and started scheduled task (logon+startup): $taskName" -ForegroundColor Green
} catch {
    Write-Warning "Admin-level startup trigger failed. Falling back to logon-only task for current user."
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $triggerLogon -Settings $settings -Description "Matrix cloud heartbeat auto-recover daemon (logon-only)" | Out-Null
    Start-ScheduledTask -TaskName $taskName
    Write-Host "[OK] Installed and started scheduled task (logon-only): $taskName" -ForegroundColor Yellow
}
