Write-Output "--- MATRIX UNIFIED STARTUP ---"

# Step 1: Kill existing Node processes & port locks
Write-Output "[1/4] Performing Metabolic Purge (node.exe)..."
Start-Sleep -Milliseconds 500
taskkill /F /IM node.exe /T 2>$null

Write-Output "      Clearing Neural Ports (3000, 3001, 4000, 5173)..."
$ports = 3000, 3001, 4000, 5173
foreach ($port in $ports) {
    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
        $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conn) {
            $procId = $conn.OwningProcess
            if ($procId -gt 0) {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Output "   Cleared Port $port"
            }
        }
    }
}

# Step 2: Start Sentinel & Ghost Runner (Background)
Write-Output "[2/6] Initializing Sentinel & Ghost Runner (Core)..."
Start-Process cmd -ArgumentList "/k title NEXUS_SENTINEL && node sentinel.cjs" -WorkingDirectory "$PSScriptRoot\core"
Start-Process cmd -ArgumentList "/k title GHOST_RUNNER && node ghost-runner.cjs" -WorkingDirectory "$PSScriptRoot\core"

# Step 3: Start Reflect OS (Port 3000)
Write-Output "[3/6] Launching Reflect Core (Port 3000)..."
Start-Process cmd -ArgumentList "/k title REFLECT_OS && npm run dev" -WorkingDirectory "$PSScriptRoot\apps\reflect"

# Step 4: Start Nexus Dashboard (Port 3001)
Write-Output "[4/6] Launching Nexus Dashboard (Port 3001)..."
Start-Process cmd -ArgumentList "/k title NEXUS_DASHBOARD && npm run dev" -WorkingDirectory "$PSScriptRoot\apps\nexus"

# Step 5: Start Ghost Bridge Interface (Port 5173)
Write-Output "[5/6] Launching Ghost Bridge (Port 5173)..."
Start-Process cmd -ArgumentList "/k title GHOST_OS && npm run dev" -WorkingDirectory "$PSScriptRoot\apps\ghost-command"

# Step 6: Start Rocket Command Pro (Port 4000)
Write-Output "[6/6] Launching Rocket Command (Port 4000)..."
Start-Process cmd -ArgumentList "/k title ROCKET_CMD && npm run dev" -WorkingDirectory "$PSScriptRoot\apps\rocket-command"

Write-Output "--- UPLINK COMPLETE ---"
Write-Output "Reflect Core: http://localhost:3000"
Write-Output "Nexus Dash:   http://localhost:3001"
Write-Output "Rocket Cmd:   http://localhost:4000"
Write-Output "Ghost Bridge: http://localhost:5173"
pause
