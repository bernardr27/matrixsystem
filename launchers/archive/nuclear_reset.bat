@echo off
title Matrix Nuclear Reset
color 0C
echo.
echo  ███    ██ ██    ██  ██████ ██      ███████  █████  ██████  
echo  ████   ██ ██    ██ ██      ██      ██      ██   ██ ██   ██ 
echo  ██ ██  ██ ██    ██ ██      ██      █████   ███████ ██████  
echo  ██  ██ ██ ██    ██ ██      ██      ██      ██   ██ ██   ██ 
echo  ██   ████  ██████   ██████ ███████ ███████ ██   ██ ██   ██ 
echo.
echo  =============================================================
echo   WARNING: NUCLEAR RESET OPTION
echo  =============================================================
echo.
echo  This will:
echo  1. FORCE KILL all node processes.
echo  2. DELETE 'node_modules' in ALL workspaces (Nexus, App, Store).
echo  3. DELETE 'package-lock.json' files.
echo  4. DELETE build artifacts (.next, dist).
echo  5. Re-run 'npm install' from scratch.
echo.
echo  TYPE 'CONFIRM' to proceed, or anything else to cancel.
set /p confirm="> "

if /i "%confirm%" neq "CONFIRM" (
    echo.
    echo  Cancelled.
    pause
    exit /b
)

echo.
echo  [1/5] Terminating Processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo  [2/5] Detonating node_modules...
if exist "nexus\node_modules" rd /s /q "nexus\node_modules"
if exist "app\node_modules" rd /s /q "app\node_modules"
if exist "antigravity-store\node_modules" rd /s /q "antigravity-store\node_modules"
if exist "node_modules" rd /s /q "node_modules"

echo.
echo  [3/5] Vaporizing Lockfiles (Fresh Install Protocol)...
del /s /q "package-lock.json" >nul 2>&1

echo.
echo  [4/5] Clearing Cache...
if exist "nexus\.next" rd /s /q "nexus\.next"
if exist "app\.next" rd /s /q "app\.next"
if exist "antigravity-store\.next" rd /s /q "antigravity-store\.next"

echo.
echo  [5/5] Rebuilding Infrastructure...
echo  > Installing Root...
call npm install
echo  > Installing Nexus...
cd nexus
call npm install
cd ..
echo  > Installing App...
cd app
call npm install
cd ..
echo  > Installing Store...
cd antigravity-store
call npm install
cd ..

echo.
echo  =========================================
echo  NUCLEAR RESET COMPLETE.
echo  System is clean and ready.
echo  =========================================
pause
