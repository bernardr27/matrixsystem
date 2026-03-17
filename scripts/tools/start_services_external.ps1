$ErrorActionPreference = "Stop"

$root = "g:\matrix"
$next = Join-Path $root "node_modules\next\dist\bin\next"

function Start-IfMissing {
    param(
        [int]$Port,
        [string]$Name,
        [string]$WorkingDir,
        [string]$CommandArgs
    )

    $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($listening) {
        Write-Output "$Name already $Port"
        return
    }

    Start-Process -FilePath "node" -ArgumentList $CommandArgs -WorkingDirectory $WorkingDir -WindowStyle Hidden
    Write-Output "started $Name $Port"
}

Start-IfMissing -Port 3000 -Name "reflect" -WorkingDir (Join-Path $root "apps\reflect") -CommandArgs "$next dev -p 3000 -H 0.0.0.0"
Start-IfMissing -Port 3001 -Name "nexus" -WorkingDir (Join-Path $root "apps\nexus") -CommandArgs "$next dev -p 3001 -H 0.0.0.0"
Start-IfMissing -Port 4000 -Name "rocket" -WorkingDir (Join-Path $root "apps\rocket-command") -CommandArgs "$next dev -p 4000 -H 0.0.0.0"
Start-IfMissing -Port 5173 -Name "ghost" -WorkingDir (Join-Path $root "apps\ghost-command") -CommandArgs "$next dev -p 5173 -H 0.0.0.0"
Start-IfMissing -Port 3333 -Name "sentinel" -WorkingDir (Join-Path $root "apps\ghost-command\core") -CommandArgs "sentinel.cjs --headless --boot"
Start-IfMissing -Port 3005 -Name "citadel" -WorkingDir (Join-Path $root "apps\citadel") -CommandArgs "guardian.cjs"
