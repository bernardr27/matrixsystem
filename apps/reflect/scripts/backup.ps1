$ErrorActionPreference = "Stop"

$projectRoot = "g:\test_v2\app"
$backupRoot = "g:\test_v2\app_backups"
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$backupFile = Join-Path $backupRoot "Reflect_Backup_$timestamp.zip"

Write-Host "--- REFLECT OS BACKUP ---" -ForegroundColor Cyan

if (-not (Test-Path $backupRoot)) {
    New-Item -ItemType Directory -Path $backupRoot | Out-Null
}

$excludes = @("node_modules", ".next", ".git", ".vercel", "build_output*", "*.log", "*.sqlite*", "reflect.db")

Write-Host "Zipping '$projectRoot' to '$backupFile'..."
Write-Host "Excluding: $($excludes -join ', ')" -ForegroundColor Gray

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Zip-Folder {
    param([string]$source, [string]$destination, [string[]]$excludePatterns)
    
    $zip = [System.IO.Compression.ZipFile]::Open($destination, [System.IO.Compression.ZipArchiveMode]::Create)
    
    $files = Get-ChildItem -Path $source -Recurse
    
    foreach ($file in $files) {
        if ($file.PSIsContainer) { continue }
        
        $relativePath = $file.FullName.Substring($source.Length + 1)
        
        $skip = $false
        foreach ($pattern in $excludePatterns) {
            # Simple wildcard matching
            if ($relativePath -like "*\$pattern\*" -or $relativePath -like "$pattern*") {
                $skip = $true
                break
            }
        }
        
        if (-not $skip) {
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relativePath)
        }
    }
    
    $zip.Dispose()
}

try {
    Zip-Folder -source $projectRoot -destination $backupFile -excludePatterns $excludes
    $size = (Get-Item $backupFile).Length / 1MB
    Write-Host "Backup Successful: $([math]::Round($size, 2)) MB" -ForegroundColor Green
}
catch {
    Write-Host "Backup Failed: $_" -ForegroundColor Red
}
