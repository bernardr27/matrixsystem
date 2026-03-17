$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$nodePath = (Get-Command node -ErrorAction Stop).Source
$daemonPath = Join-Path $repoRoot "scripts\tools\cloud_self_heal_daemon.cjs"
$startupDir = [Environment]::GetFolderPath('Startup')
$launcherPath = Join-Path $startupDir "MatrixCloudSelfHeal.vbs"

if (-not (Test-Path $daemonPath)) {
    throw "Missing daemon script: $daemonPath"
}

$vbs = @"
Set shell = CreateObject("WScript.Shell")
shell.Run """" & "$nodePath" & """ """ & "$daemonPath" & """ --interval-sec=45 --stale-sec=120"", 0, False
"@

Set-Content -Path $launcherPath -Value $vbs -Encoding ASCII

Write-Host "[OK] Installed startup launcher: $launcherPath" -ForegroundColor Green
Write-Host "[INFO] It will start hidden on next logon." -ForegroundColor Cyan
