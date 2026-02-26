@echo off
setlocal EnableDelayedExpansion
set NODE_OPTIONS=--dns-result-order=ipv4first
:: MATRIX START — Unified Startup (PRODUCTION MODE)
title MATRIX IGNITION
cd /d "%~dp0.."

echo.
echo  [1/3] Clearing stale processes...
echo.

call scripts\matrix_clean.bat
:: Reset working directory after matrix_clean hijacks it
cd /d "%~dp0.."
timeout /t 2 /nobreak >nul

:: ─── PHASE 2: BUILD CHECK ───
echo.
echo  [2/3] Verifying production builds...

if not exist "apps\reflect\.next" (
    echo       Building Reflect...
    pushd apps\reflect
    call npm run build --webpack >nul 2>&1
    popd
)

if not exist "apps\nexus\.next" (
    echo       Building Nexus...
    pushd apps\nexus
    call npm run build --webpack >nul 2>&1
    popd
)

if not exist "apps\ghost-command\.next" (
    echo       Building Ghost Command...
    pushd apps\ghost-command
    call npm run build --webpack >nul 2>&1
    popd
)

if not exist "apps\rocket-command\.next" (
    echo       Building Rocket Command...
    pushd apps\rocket-command
    call npm run build --webpack >nul 2>&1
    popd
)

if not exist "apps\citadel\.next" (
    echo       Building Citadel...
    pushd apps\citadel
    call npm run build --webpack >nul 2>&1
    popd
)

echo       All builds verified.

:: ─── PHASE 3: LAUNCH (Production) ───
echo.
echo  [3/3] Launching Core Orchestrators (Production)...
echo        - Sentinel: Infrastructure and Gates
echo        - Ghost Runner: AI and Command Core
echo        - Citadel Guardian: Security and Tailscale
echo.
echo  Sentinel handles boot for Reflect, Nexus, Rocket, and Ghost Apps
echo.

cd /d "%~dp0\.."

npx concurrently -k ^
  --names "SENTINEL,GHOST-CORE,CITADEL" ^
  --prefix-colors "gray,yellow,green" ^
  "node apps/ghost-command/core/sentinel.cjs --boot --headless" ^
  "node apps/ghost-command/core/ghost-runner.cjs" ^
  "node apps/citadel/guardian.cjs"

echo.
echo  Services stopped. To start again, run this script or use Matrix Hub.
pause
