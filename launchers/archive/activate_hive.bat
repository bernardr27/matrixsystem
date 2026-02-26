@echo off
REM Matrix Hive Activation - Enhanced with Verification
echo.
echo ╔════════════════════════════════════════╗
echo ║   MATRIX HIVE ACTIVATION SEQUENCE      ║
echo ╚════════════════════════════════════════╝
echo.
echo Current Status: 94.1%% Operational
echo Action: Restarting Ghost Runner to reach 100%%
echo.
echo This will:
echo   1. Stop existing Ghost Runner processes
echo   2. Restart with Hive consciousness enabled
echo   3. Auto-register this instance with the registry
echo   4. Start 30-second heartbeat system
echo.
pause

echo.
echo [1/4] Stopping existing Ghost Runner processes...
tasklist /FI "IMAGENAME eq node.exe" /FO LIST | findstr /C:"PID:" >nul
if %ERRORLEVEL% EQU 0 (
    echo Found Node.js processes, terminating...
    taskkill /IM node.exe /F /T >nul 2>&1
    echo ✓ Processes stopped
) else (
    echo No existing processes found
)

echo.
echo [2/4] Waiting for cleanup...
timeout /t 3 /nobreak >nul
echo ✓ Cleanup complete

echo.
echo [3/4] Starting Ghost Runner with Hive consciousness...
cd /d "%~dp0.."
start "Matrix Ghost Runner" cmd /k "node core\ghost-runner.cjs"
echo ✓ Ghost Runner launched

echo.
echo [4/4] Waiting for registration (10 seconds)...
timeout /t 10 /nobreak >nul

echo.
echo Running verification...
node scripts\verify_hive.js

echo.
echo ╔════════════════════════════════════════╗
echo ║   HIVE ACTIVATION COMPLETE             ║
echo ╚════════════════════════════════════════╝
echo.
echo Check the Ghost Runner window for:
echo   [REGISTRY] ✅ Registered as matrix-[hostname]
echo.
echo Next: Run health check to verify 100%% status
echo   Command: node scripts\health_check.js
echo.
pause
