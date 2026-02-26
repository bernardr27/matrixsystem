@echo off
title Nexus System Upgrade
color 0E
echo.
echo  =========================================
echo        NEXUS SYSTEM UPGRADE
echo  =========================================
echo  =========================================
echo.
cd /d "%~dp0.."
echo  WARNING: This will stop all running services and update dependencies.
echo  Press Ctrl+C to cancel or any key to continue...
pause >nul

:: 1. Stop Services
echo.
echo  [1/4] Stopping Services...
taskkill /F /IM node.exe /T >nul 2>&1
echo  Services stopped.

:: 2. Clean artifacts
echo.
echo  [2/4] Cleaning Build Artifacts...
if exist "nexus\.next" rd /s /q "nexus\.next"
if exist "app\.next" rd /s /q "app\.next"
if exist "antigravity-store\.next" rd /s /q "antigravity-store\.next"
echo  Clean complete.

:: 3. Update Dependencies
echo.
echo  [3/4] Updating Dependencies (This may take a while)...

echo  > Updating Root...
call npm install
echo  > Updating Nexus...
cd nexus
call npm install
cd ..

echo  > Updating App...
cd app
call npm install
cd ..

echo  > Updating Store...
cd antigravity-store
call npm install
cd ..

:: 4. Finalizing
echo.
echo  [4/4] Upgrade Complete!
echo.
echo  =========================================
echo  System is up to date.
echo  You can now launch the system with 'matrix_launch.bat'.
echo  =========================================
echo.
pause
