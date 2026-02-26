$ErrorActionPreference = "Stop"

$workspaceRoot = "g:\test_v2"
$backupRoot = Join-Path $workspaceRoot "_backups"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupFile = Join-Path $backupRoot "Global_Backup_$timestamp.zip"

Write-Host "--- GLOBAL SYSTEM BACKUP ---" -ForegroundColor Cyan
Write-Host "Target: $workspaceRoot"
Write-Host "Destination: $backupFile"

if (-not (Test-Path $backupRoot)) {
    New-Item -ItemType Directory -Path $backupRoot | Out-Null
}

$excludes = @(
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "_backups",
    "nexus_backups",
    "*.log",
    "*.lock",
    "dist",
    "build"
)

Write-Host "Zipping workspace (this may take a moment)..." -ForegroundColor Yellow

# Use .NET compression for speed and exclusion handling
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Zip-Folder {
    param([string]$source, [string]$destination, [string[]]$excludePatterns)
    
    $zip = [System.IO.Compression.ZipFile]::Open($destination, [System.IO.Compression.ZipArchiveMode]::Create)
    
    $files = Get-ChildItem -Path $source -Recurse
    
    foreach ($file in $files) {
        if ($file.PSIsContainer) { continue }
        
        $relativePath = $file.FullName.Substring($source.Length + 1)
        
        # Check excludes
        $skip = $false
        foreach ($pattern in $excludePatterns) {
            if ($relativePath -like "*\$pattern\*" -or $relativePath -like "$pattern\*") {
                $skip = $true
                break
            }
        }
        
        if (-not $skip) {
            # Write-Host "Adding: $relativePath" -ForegroundColor Gray
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relativePath)
        }
    }
    
    $zip.Dispose()
}

try {
    Zip-Folder -source $workspaceRoot -destination $backupFile -excludePatterns $excludes
    $size = (Get-Item $backupFile).Length / 1MB
    Write-Host "Backup Complete: node_modules excluded." -ForegroundColor Green
    Write-Host "Size: $([math]::Round($size, 2)) MB" -ForegroundColor Green
}
catch {
    Write-Host "Backup Failed: $_" -ForegroundColor Red
}
