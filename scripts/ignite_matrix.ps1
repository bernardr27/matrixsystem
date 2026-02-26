# Matrix Ignition Sequence
Write-Host "Initializing Matrix Ecosystem..." -ForegroundColor Cyan

$root = "g:\matrix"

# Function to start a process in a new window
function Start-Service {
    param($name, $cmd, $path, $port)
    Write-Host "Igniting $name..." -ForegroundColor Green
    Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoExit", "-Command", "cd '$path'; $cmd" -WorkingDirectory $path
}

# 1. Start Runner (AI Core)
Start-Service -name "Runner" -cmd "node ghost-runner.cjs" -path $root -port "N/A"

# 2. Start Reflect (Main App)
Start-Service -name "Reflect" -cmd "npm run dev" -path "$root\apps\reflect" -port 3000

# 3. Start Nexus (Command Center)
Start-Service -name "Nexus" -cmd "npm run dev" -path "$root\apps\nexus" -port 3001

# 4. Start Ghost Command (Mobile functionality)
Start-Service -name "Ghost" -cmd "npm run dev" -path "$root\apps\ghost-command" -port 5173

Write-Host "Matrix Ignition Complete. All services launching..." -ForegroundColor Magenta
