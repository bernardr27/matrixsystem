# Ghost Command Backup Script
$ErrorActionPreference = "Stop"
$sourceDir = "g:\test_v2\ghost-command"
$backupRoot = "g:\test_v2\_backups\ghost-command"
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$backupFile = "$backupRoot\Ghost_Command_Backup_$timestamp.zip"

Write-Host "Starting Ghost Command Backup..." -ForegroundColor Cyan

# Ensure backup directory exists
if (-not (Test-Path $backupRoot)) {
    New-Item -ItemType Directory -Path $backupRoot | Out-Null
}

# Define exclusions
$exclude = @("node_modules", ".next", ".git")

# Create Zip
Write-Host "Zipping '$sourceDir' to '$backupFile'..." -ForegroundColor Yellow
Write-Host "Excluding: $($exclude -join ', ')"

$files = Get-ChildItem -Path $sourceDir -Recurse | Where-Object {
    $path = $_.FullName
    $skip = $false
    foreach ($ex in $exclude) {
        if ($path -like "*\$ex\*") { $skip = $true; break }
        if ($path -like "*\$ex") { $skip = $true; break }
    }
    return -not $skip
}

Compress-Archive -Path $files.FullName -DestinationPath $backupFile -CompressionLevel Optimal

if (Test-Path $backupFile) {
    $size = (Get-Item $backupFile).Length / 1MB
    Write-Host "Backup Successful: $([math]::Round($size, 2)) MB" -ForegroundColor Green
}
else {
    Write-Error "Backup failed to create file."
}
