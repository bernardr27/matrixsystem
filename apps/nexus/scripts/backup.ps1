# Nexus Backup Script
$ErrorActionPreference = "Stop"
$sourceDir = "g:\test_v2\nexus"
$backupRoot = "g:\test_v2\nexus_backups"
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$backupFile = "$backupRoot\Nexus_Backup_$timestamp.zip"

Write-Host "Starting Nexus Backup..." -ForegroundColor Cyan

# Ensure backup directory exists
if (-not (Test-Path $backupRoot)) {
    New-Item -ItemType Directory -Path $backupRoot | Out-Null
}

# Define exclusions
$exclude = @("node_modules", ".next", ".git", ".vercel", "nexus_backups")

# Create Zip
Write-Host "Zipping '$sourceDir' to '$backupFile'..." -ForegroundColor Yellow
Write-Host "Excluding: $($exclude -join ', ')"

# Use Compress-Archive with exclusion requires a bit of logic or external tool.
# PowerShell's Compress-Archive doesn't natively support robust exclusions easily recursively.
# We will use a filter approach.

$files = Get-ChildItem -Path $sourceDir -Recurse | Where-Object {
    $path = $_.FullName
    $skip = $false
    foreach ($ex in $exclude) {
        if ($path -like "*\$ex\*") { $skip = $true; break }
        if ($path -like "*\$ex") { $skip = $true; break }
    }
    return -not $skip
}

# Note: Compress-Archive can be slow with many small files. 
# For a robust solution, we might want to use 7z if installed, but we'll stick to native PS for portability.
# To avoid path length issues, we pass the file objects.

Compress-Archive -Path $files.FullName -DestinationPath $backupFile -CompressionLevel Optimal

if (Test-Path $backupFile) {
    $size = (Get-Item $backupFile).Length / 1MB
    Write-Host "Backup Successful: $([math]::Round($size, 2)) MB" -ForegroundColor Green
}
else {
    Write-Error "Backup failed to create file."
}
