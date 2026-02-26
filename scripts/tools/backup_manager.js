const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
// Configuration
const rootDir = path.join(__dirname, '..', '..');
const BACKUP_DIR = path.join(rootDir, '_backups');
const DIRS_TO_BACKUP = ['nexus', 'app', 'ghost-command'];
const FILES_TO_BACKUP = [
    'sentinel.cjs', 'ghost-runner.cjs', 'matrix_launch.bat',
    'matrix_maintenance.bat', 'package.json'
];

// Helper to format date
const getTimestamp = () => {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 16);
};

// Main Backup Function
const runBackup = () => {
    console.log('\x1b[36m[BACKUP] Initializing Matrix Workspace Backup...\x1b[0m');

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
        console.log(`[BACKUP] Created backup directory: ${BACKUP_DIR}`);
    }

    const timestamp = getTimestamp();
    const zipName = `Matrix_Backup_${timestamp}.zip`;
    const zipPath = path.join(BACKUP_DIR, zipName);

    // We'll use a temporary PowerShell script to zip because standard Windows zip is tricky from CLI
    // Alternatively, we use powershell directly.

    // Construct list of items to include
    const itemsToZip = [];

    // Check Dirs
    DIRS_TO_BACKUP.forEach(dir => {
        if (fs.existsSync(path.join(rootDir, dir))) {
            itemsToZip.push(dir);
        }
    });

    // Check Files
    FILES_TO_BACKUP.forEach(file => {
        if (fs.existsSync(path.join(rootDir, file))) {
            itemsToZip.push(file);
        }
    });

    if (itemsToZip.length === 0) {
        console.log('\x1b[31m[BACKUP] Nothing to backup found!\x1b[0m');
        return;
    }

    console.log(`[BACKUP] Archiving ${itemsToZip.length} items to ${zipName}...`);
    console.log(`[BACKUP] Excluding: node_modules, .next, .turbo, .git, dist, build`);

    // PowerShell Compress-Archive command builder
    // Note: Compress-Archive is slow for very large projects but works natively.
    // To exclude specific folders (like node_modules) recursively is complex with Compress-Archive in one simple command.
    // Strategy: We will tell user we are skipping node_modules by NOT selecting them if we can,
    // but Compress-Archive on a folder includes everything.

    // Robust Strategy: 7z or tar if available, else PowerShell.
    // Since we want "native" windows, we'll try a smart PowerShell script that excludes patterns.

    const psCommand = `
    $exclusions = @('node_modules', '.next', '.turbo', '.git', 'dist', 'build', '.DS_Store');
    $source = '${rootDir.replace(/\\/g, '\\\\')}';
    $destination = '${zipPath.replace(/\\/g, '\\\\')}';
    $items = '${itemsToZip.join(',')}'.Split(',');
    
    Add-Type -AssemblyName System.IO.Compression.FileSystem;
    $compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal;
    $zip = [System.IO.Compression.ZipFile]::Open($destination, 'Create');
    
    foreach ($item in $items) {
        $fullPath = Join-Path $source $item;
        if (Test-Path $fullPath) {
            Write-Host "Archiving $item...";
            if ((Get-Item $fullPath).PSIsContainer) {
                # Directory: Recursive add with exclusion
                $files = Get-ChildItem -Path $fullPath -Recurse;
                foreach ($file in $files) {
                    $relPath = $file.FullName.Substring($source.Length + 1);
                    # Check exclusions
                    $exclude = $false;
                    foreach ($ex in $exclusions) {
                        if ($relPath -match "\\\\$ex\\\\") { $exclude = $true; break; }
                        if ($relPath -match "^$item\\\\$ex\\\\") { $exclude = $true; break; } # Root level dir exclusion
                        if ($relPath -match "\\\\$ex$") { $exclude = $true; break; } # exact match folder/file
                    }
                    if (-not $exclude -and -not $file.PSIsContainer) {
                         [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relPath, $compressionLevel);
                    }
                }
            } else {
                # File: Just add
                $relPath = $item;
                 [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $relPath, $compressionLevel);
            }
        }
    }
    $zip.Dispose();
    `;

    try {
        // We write the PS script to a temp file to avoid CLI length limits and escaping hell
        fs.writeFileSync('temp_backup.ps1', psCommand);
        execSync(`powershell -ExecutionPolicy Bypass -File temp_backup.ps1`, { stdio: 'inherit' });
        fs.unlinkSync('temp_backup.ps1');

        console.log(`\x1b[32m[BACKUP] Success! Archive saved to: ${zipPath}\x1b[0m`);
    } catch (error) {
        console.error('\x1b[31m[BACKUP] Failed.\x1b[0m', error);
    }
};

runBackup();
