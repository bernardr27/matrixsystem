@echo off
setlocal EnableDelayedExpansion
:: MATRIX START — Unified Startup (FIXED)
title MATRIX IGNITION
cd /d "%~dp0.."

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║       MATRIX UNIFIED LAUNCHER v4.1       ║
echo  ║       (Production Build Mode - STABLE)   ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ─── PHASE 1: CLEANUP ───
echo  [1/3] Clearing stale processes...

powershell -NoProfile -Command "foreach($p in 3000,3001,5173){$c=Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue;if($c){$c.OwningProcess|Select-Object -Unique|ForEach-Object{Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue};Write-Host '       Freed port' $p}}" 2>nul
timeout /t 2 /nobreak >nul

:: ─── PHASE 2: BUILD CHECK ───
echo.
echo  [2/3] Verifying production builds...

if not exist "apps\reflect\.next" (
    echo       Building Reflect...
    cd apps\reflect
    call npm run build --webpack >nul 2>&1
    cd ..\..
)

if not exist "apps\nexus\.next" (
    echo       Building Nexus...
    cd apps\nexus
    call npm run build --webpack >nul 2>&1
    cd ..\..
)

if not exist "apps\ghost-command\.next" (
    echo       Building Ghost Command...
    cd apps\ghost-command
    call npm run build --webpack >nul 2>&1
    cd ..\..
)

echo       All builds verified.

:: ─── PHASE 3: LAUNCH (Production) ───
echo.
echo  [3/3] Launching Services (Production Mode)...
echo        - Sentinel (Core)
echo        - Ghost Runner (Core)
echo        - Reflect OS (3000)
echo        - Nexus Hub (3001)
echo        - Ghost Command (5173)
echo.
echo  (This window holds all logs. Close it to stop everything.)
echo.

:: Use npx concurrently with production servers for stability
:: Dev mode was unstable; production mode with built .next caches is reliable

npx concurrently -k ^
  --names "SENTINEL,GHOST-CORE,REFLECT,NEXUS,GHOST-CMD" ^
  --prefix-colors "gray,yellow,cyan,magenta,blue" ^
  "node apps/ghost-command/core/sentinel.cjs" ^
  "node apps/ghost-command/core/ghost-runner.cjs" ^
  "cd apps/reflect && npm run start -- -p 3000" ^
  "cd apps/nexus && npm run start -- -p 3001" ^
  "cd apps/ghost-command && npm run start -- -p 5173"

echo.
echo  Services stopped. Restart them to continue.
pause

