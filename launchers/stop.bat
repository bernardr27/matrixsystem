@echo off
setlocal EnableDelayedExpansion
:: MATRIX STOP — Clean shutdown of all Matrix services
title MATRIX SHUTDOWN
cd /d "%~dp0.."

echo.
echo  [MATRIX] INITIATING SHUTDOWN SEQUENCE...
echo  =========================================
echo.

:: Kill all titled service windows
for %%T in (SENTINEL_GUARD GHOST_RUNNER REFLECT_OS GHOST_OS NEXUS_HUB ROCKET_CMD MATRIX_HEADLESS) do (
    taskkill /F /FI "WINDOWTITLE eq %%T*" /IM cmd.exe >nul 2>&1
)
echo  [x] Service windows closed.

:: Kill all node processes
taskkill /F /IM node.exe /T >nul 2>&1
echo  [x] Node.js processes terminated.

:: Brief settle
timeout /t 1 /nobreak >nul

:: Verify ports are free (single PowerShell call)
powershell -NoProfile -Command "foreach($p in 3000,3001,3005,4000,5173){$c=Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue;if($c){Write-Host '  [!] Port' $p 'still in use - forcing...';$c.OwningProcess|Select-Object -Unique|ForEach-Object{Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue}}}" 2>nul

echo.
echo  [MATRIX] ALL SYSTEMS OFFLINE.
echo.
