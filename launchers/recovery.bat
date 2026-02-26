@echo off
title MATRIX EMERGENCY RECOVERY
echo.
echo  [1/5] Killing processes...
taskkill /F /IM node.exe >nul 2>&1
echo        Done.

echo  [2/5] Wiping dependencies (Reflect)...
cd /d "g:\matrix\apps\reflect"
if exist node_modules rd /s /q node_modules
if exist .next rd /s /q .next
if exist package-lock.json del /f /q package-lock.json
echo        Installing Reflect...
call npm install --legacy-peer-deps

echo  [3/5] Wiping dependencies (Nexus)...
cd /d "g:\matrix\apps\nexus"
if exist node_modules rd /s /q node_modules
if exist .next rd /s /q .next
if exist package-lock.json del /f /q package-lock.json
echo        Installing Nexus...
call npm install --legacy-peer-deps

echo  [4/5] Wiping dependencies (Ghost)...
cd /d "g:\matrix\apps\ghost-command"
if exist node_modules rd /s /q node_modules
if exist .next rd /s /q .next
if exist package-lock.json del /f /q package-lock.json
echo        Installing Ghost...
call npm install --legacy-peer-deps

echo  [5/5] Wiping dependencies (Rocket)...
cd /d "g:\matrix\apps\rocket-command"
if exist node_modules rd /s /q node_modules
if exist .next rd /s /q .next
if exist package-lock.json del /f /q package-lock.json
echo        Installing Rocket...
call npm install --legacy-peer-deps

echo.
echo  RECOVERY COMPLETE.
echo  Starting systems...
cd /d "g:\matrix"
call launchers\start.bat
