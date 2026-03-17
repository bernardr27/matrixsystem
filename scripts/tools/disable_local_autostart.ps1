$ErrorActionPreference = "SilentlyContinue"

# --- Remove all Matrix VBS startup files ---
$startupFolder = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
$matrixVbs = @(
    "MatrixCloudSelfHeal.vbs",
    "MatrixSentinel.vbs",
    "MatrixGuardian.vbs",
    "matrix_boot.vbs",
    "citadel_guardian_silent.vbs",
    "sentinel_silent.vbs",
    "headless.vbs",
    "background.vbs",
    "launch_silent.vbs"
)

foreach ($vbs in $matrixVbs) {
    $path = Join-Path $startupFolder $vbs
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Output "  Removed startup: $vbs"
    }
}

# Catch-all: remove any VBS in startup folder containing "matrix" or "sentinel"
Get-ChildItem "$startupFolder\*.vbs" -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match "(?i)(matrix|sentinel|citadel|ghost|guardian)"
} | ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Output "  Removed startup: $($_.Name)"
}

# --- Remove all Matrix scheduled tasks ---
$taskNames = @(
    "MatrixCloudSelfHeal",
    "MatrixSentinel",
    "MatrixGuardian",
    "MatrixBoot",
    "MatrixAutostart"
)

foreach ($taskName in $taskNames) {
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($task) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Output "  Removed scheduled task: $taskName"
    }
}

# Catch-all: remove any scheduled task starting with "Matrix"
Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object {
    $_.TaskName -like "Matrix*"
} | ForEach-Object {
    Unregister-ScheduledTask -TaskName $_.TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Output "  Removed scheduled task: $($_.TaskName)"
}

# --- Remove registry Run key entries ---
$runKeyPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$runValues = Get-ItemProperty -Path $runKeyPath -ErrorAction SilentlyContinue
if ($runValues) {
    foreach ($prop in $runValues.PSObject.Properties) {
        if ($prop.Name -match "(?i)(matrix|sentinel|citadel|ghost)" -and $prop.Name -notlike "PS*") {
            Remove-ItemProperty -Path $runKeyPath -Name $prop.Name -ErrorAction SilentlyContinue
            Write-Output "  Removed registry autostart: $($prop.Name)"
        }
    }
}

Write-Output "auto_start_disabled"
