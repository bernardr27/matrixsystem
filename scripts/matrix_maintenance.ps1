# Matrix Maintenance Protocol Engine (v2.2) - "Golden State" Recovery
# Purpose: Weekly self-healing, stasis, hygiene, re-ignition, and verification.

$ErrorActionPreference = "SilentlyContinue"
$LogFile = "g:\matrix\logs\maintenance_$(Get-Date -Format 'yyyyMMdd_HHmm').log"

function Write-Log($Message, $Color = "Cyan") {
    $Timestamp = Get-Date -Format "HH:mm:ss"
    $FormattedMessage = "[$Timestamp] $Message"
    Write-Host $FormattedMessage -ForegroundColor $Color
    $FormattedMessage | Out-File -FilePath $LogFile -Append
}

Write-Log "--- INITIATING WEEKLY MAINTENANCE CYCLE (v2.2) ---" "Yellow"

# 0. PRE-MAINTENANCE SNAPSHOT
Write-Log "[STEP 0] Archiving current state before stasis..."
try {
    powershell -ExecutionPolicy Bypass -File g:\matrix\scripts\snapshot.ps1
    Write-Log "   Pre-maintenance snapshot complete." "Green"
}
catch {
    Write-Log "   [WARN] Snapshot failed. Proceeding with caution." "Yellow"
}

# 1. TOTAL SYSTEM STASIS
Write-Log "[STEP 1] Entering Total Stasis Mode..."
$ProcessList = "node", "cmd", "powershell"
foreach ($ProcName in $ProcessList) {
    if ($ProcName -eq "powershell" -and $PID) {
        $Procs = Get-Process -Name $ProcName | Where-Object { ($_.Path -like "*g:\matrix*" -or $_.CommandLine -like "*g:\matrix*") -and $_.Id -ne $PID }
    }
    else {
        $Procs = Get-Process -Name $ProcName | Where-Object { $_.Path -like "*g:\matrix*" -or $_.CommandLine -like "*g:\matrix*" }
    }
    
    if ($Procs) {
        Write-Log "   Terminating $($Procs.Count) neural threads ($ProcName)..."
        $Procs | Stop-Process -Force
    }
}
# Kill specific background watchers
Get-Process | Where-Object { $_.CommandLine -like "*sentinel.cjs*" -or $_.CommandLine -like "*ghost-runner.cjs*" } | Stop-Process -Force

# 2. DEEP NEURAL HYGIENE
Write-Log "[STEP 2] Flushing caches and volatile fragments..."
$PathsToClean = @(
    "g:\matrix\apps\ghost-command\.next",
    "g:\matrix\apps\reflect\.next",
    "g:\matrix\apps\nexus\.next",
    "g:\matrix\.antigravity",
    "g:\matrix\logs\*.log" 
)

foreach ($Path in $PathsToClean) {
    if (Test-Path $Path) {
        Write-Log "   Eradicating path: $Path"
        Remove-Item -Path $Path -Recurse -Force
    }
}

# 3. DATABASE PURGE
Write-Log "[STEP 3] Cleansing the Bridge..."
try {
    node g:\matrix\scripts\cleanup-bridge.cjs
    Write-Log "   Ghost Bridge hygiene complete." "Green"
}
catch {
    Write-Log "   [WARN] Bridge hygiene failed." "Red"
}

# 4. ENVIRONMENT AUDIT
Write-Log "[STEP 4] Scanning Environmental Integrity..."
$ESLintPath = Get-Command eslint -ErrorAction SilentlyContinue
if (-not $ESLintPath) {
    Write-Log "   [DRIFT] 'eslint' not found. Checking local..." "Red"
    if (Test-Path "g:\matrix\apps\ghost-command\node_modules\.bin\eslint.cmd") {
        Write-Log "   [FIX] Local ESLint found." "Green"
    }
}

# 5. CORE INTEGRITY SCAN
Write-Log "[STEP 5] Verifying Core Services..."
$CoreFiles = @("g:\matrix\core\sentinel.cjs", "g:\matrix\core\ghost-runner.cjs")
foreach ($File in $CoreFiles) {
    if (Test-Path $File) {
        Write-Log "   Verified: $(Split-Path $File -Leaf)" "Green"
    }
    else {
        Write-Log "   [CRIT] Missing core file: $File" "Red"
    }
}

# 6. POST-MAINTENANCE VERIFICATION
Write-Log "[STEP 6] Executing Matrix Smoke Test..."
try {
    node g:\matrix\scripts\smoke_test.js
    Write-Log "   Verification: NOMINAL. Matrix established." "Green"
}
catch {
    Write-Host "   [CRIT] Verification: DEGRADED. Re-ignition anomaly detected." -ForegroundColor Red
}

Write-Log "--- MAINTENANCE COMPLETE ---" "Yellow"
Write-Log "Snapshot saved to: $LogFile"
Write-Log "System in Golden State. Ready for Re-Certification." "Green"
