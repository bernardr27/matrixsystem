@echo off
setlocal EnableDelayedExpansion
set NODE_OPTIONS=--dns-result-order=ipv4first
title MATRIX MASTER CONTROL
cd /d "%~dp0.."

:MENU
cls
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     MATRIX // MASTER CONTROL  v2.0       ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Quick status check (single PowerShell call instead of 3 separate ones)
powershell -NoProfile -Command "$s=0;foreach($p in 3000,3001,4000,5173){if(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue){$s++}};Write-Host $s" 2>nul | findstr /R "[0-9]" >nul 2>&1
for /f %%N in ('powershell -NoProfile -Command "$s=0;foreach($p in 3000,3001,4000,5173){if(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue){$s++}};$s" 2^>nul') do set SERVICES=%%N
if not defined SERVICES set SERVICES=0
if !SERVICES! GEQ 4 (
    echo   STATUS: [ONLINE] !SERVICES!/4 services running
) else if !SERVICES! GEQ 1 (
    echo   STATUS: [PARTIAL] !SERVICES!/4 services running
) else (
    echo   STATUS: [OFFLINE] No services detected
)
echo.
echo  ──────────────────────────────────────────
echo   [1] START ALL (Sentinel + Runner + Apps)
echo   [2] RESTORE (Kill all processes)
echo   [3] DIAGNOSTICS (System Check)
echo   [4] TRIAGE (Code Doctor)
echo   [5] OLLAMA (Local AI)
echo   [6] UPGRADE (Install Dependencies)
echo   [7] BUILD SYSTEM (Individual or Full)
echo   [8] WATCHDOG  (Start + Auto-Monitor)
echo.
echo   [0] EXIT
echo.
set /p choice="Command: "

if "%choice%"=="1" goto START
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto DIAG
if "%choice%"=="4" goto TRIAGE
if "%choice%"=="5" goto OLLAMA
if "%choice%"=="6" goto UPGRADE
if "%choice%"=="7" goto BUILD
if "%choice%"=="8" goto WATCHDOG
if "%choice%"=="0" exit

:BUILD
call launchers\build.bat
goto MENU

:START
cls
echo.
echo  [1] DEVELOPMENT (Hot Reload - Default)
echo  [2] PRODUCTION  (Optimized - Requires Build)
echo.
set /p mode="Select Mode [1/2]: "
if "%mode%"=="2" (
    call launchers\start.bat PROD
) else (
    call launchers\start.bat DEV
)
goto MENU

:STOP
call launchers\stop.bat
goto MENU

:DIAG
call launchers\diagnostic_viewer.bat
goto MENU

:TRIAGE
echo  ╚══════════════════════════════════════════╝
echo.
echo  [1]  EVOLVE  - Scan for improvements
echo  [2]  PURGE   - Find and fix code issues
echo  [3]  ORACLE  - Generate audit report
echo  [4]  FULL    - Run all modules
echo  [0]  Back
echo.
choice /C 12340 /M "Module: "
if errorlevel 5 goto :MENU
echo.
set /p APP="Target app (reflect/nexus/ghost-command): "

if errorlevel 4 ( node apps\ghost-command\core\triage.cjs full %APP% )
if errorlevel 3 ( node apps\ghost-command\core\triage.cjs oracle %APP% )
if errorlevel 2 ( node apps\ghost-command\core\triage.cjs purge %APP% )
if errorlevel 1 ( node apps\ghost-command\core\triage.cjs evolve %APP% )
echo.
pause
goto :MENU

:UPGRADE
cls
echo.
echo  [MATRIX] SYSTEM UPGRADE
echo  ═══════════════════════
echo  This will stop all services, clean caches, and reinstall dependencies.
echo.
choice /C YN /M "Proceed? "
if errorlevel 2 goto :MENU

echo.
echo  [1/5] Stopping services...
call launchers\stop.bat

echo  [2/5] Clearing build caches...
for %%D in (apps\reflect apps\nexus apps\ghost-command apps\rocket-command) do (
    if exist "%%D\.next" rd /s /q "%%D\.next" 2>nul
)
echo        Done.

echo  [3/5] Installing root dependencies...
call npm install --legacy-peer-deps >nul 2>&1
echo        Done.

echo  [4/5] Installing app dependencies...
for %%D in (apps\reflect apps\nexus apps\ghost-command apps\rocket-command) do (
    echo        %%D...
    pushd "%%D"
    call npm.cmd install --legacy-peer-deps >nul 2>&1
    popd
)
echo        Done.

echo  [5/5] Upgrade complete!
echo.
choice /C YN /M "Start all services now? "
if errorlevel 2 goto :MENU
call launchers\start.bat
goto :MENU

:OLLAMA
cls
echo  [MATRIX] Starting Ollama AI Engine...
call launchers\start_ollama.bat
goto :MENU

:WATCHDOG
cls
echo  [MATRIX] Starting Watchdog (auto-restart + health monitor)...
echo.
call launchers\stop.bat
echo.
node core\watchdog.cjs
goto :MENU
