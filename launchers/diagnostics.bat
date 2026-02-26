@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0.."

echo.
echo  MATRIX DIAGNOSTICS - App Launch Check
echo  ======================================
echo.

:: Check if builds exist
echo [CHECK] Production Builds:
if exist "apps\reflect\.next" (
    echo   ✓ Reflect build found
) else (
    echo   ✗ Reflect build MISSING - will rebuild on launch
)

if exist "apps\nexus\.next" (
    echo   ✓ Nexus build found
) else (
    echo   ✗ Nexus build MISSING - will rebuild on launch
)

if exist "apps\ghost-command\.next" (
    echo   ✓ Ghost Command build found
) else (
    echo   ✗ Ghost Command build MISSING - will rebuild on launch
)

echo.
echo [CHECK] Port Status:
powershell -NoProfile -Command "^
foreach($p in 3000,3001,5173) {^
    $c = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue;^
    if($c) {^
        Write-Host \"  ⚠  Port $p is IN USE\";^
    } else {^
        Write-Host \"  ✓ Port $p is free\";^
    }^
}"

echo.
echo [CHECK] Node/NPM Status:
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%A in ('node -v') do (
        echo   ✓ Node: %%A
    )
) else (
    echo   ✗ Node.js NOT FOUND in PATH
)

where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%A in ('npm -v') do (
        echo   ✓ NPM: %%A
    )
) else (
    echo   ✗ NPM NOT FOUND in PATH
)

echo.
echo [CHECK] Dependencies:
if exist "apps\reflect\node_modules" (
    echo   ✓ Reflect dependencies installed
) else (
    echo   ✗ Reflect dependencies MISSING
)

if exist "apps\nexus\node_modules" (
    echo   ✓ Nexus dependencies installed
) else (
    echo   ✗ Nexus dependencies MISSING
)

if exist "apps\ghost-command\node_modules" (
    echo   ✓ Ghost Command dependencies installed
) else (
    echo   ✗ Ghost Command dependencies MISSING
)

echo.
echo [CHECK] Recent Logs:
if exist "logs\matrix_session.log" (
    echo   Last 20 lines of logs:
    echo   -----------------------
    powershell -NoProfile -Command "Get-Content 'logs\matrix_session.log' | Select-Object -Last 20 | ForEach-Object { Write-Host \"   $_\" }"
) else (
    echo   ✗ No logs found yet (first run?)
)

echo.
echo.
echo [RECOMMENDATION]:
echo   1. If ports are IN USE: Run [K] from Matrix Hub to kill them
echo   2. If dependencies are MISSING: Run [6] then [2] in Matrix Hub
echo   3. If builds are MISSING: Builds will auto-generate on first launch
echo   4. If still having issues: Check logs above for error messages
echo.

pause

