@echo off
cd /d "%~dp0"
echo [NEXUS] SYSTEM PRE-FLIGHT CHECK...
echo ----------------------------------

echo [1/4] Installing Root Dependencies...
call npm install --legacy-peer-deps
echo.

echo [2/4] Installing Reflect Core (App)...
cd apps\reflect
call npm.cmd install --legacy-peer-deps
cd ..\..
echo.

echo [3/4] Installing Nexus Dashboard...
cd apps\nexus
call npm.cmd install --legacy-peer-deps
cd ..\..
echo.

echo [4/4] Installing Ghost Command...
cd apps\ghost-command
call npm.cmd install --legacy-peer-deps
cd ..\..
echo.

echo [SYSTEM] ALL SYSTEMS PRIMED.
echo.
echo [LAUNCH] INITIATING MATRIX...
call matrix_launch.bat
