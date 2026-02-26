@echo off
cd /d "%~dp0"
title MATRIX_SYSTEM_RESET
echo [NEXUS] INITIATING DEEP SYSTEM PURGE (FORCE RESET)...
echo ---------------------------------------------------

:: Kill any previous "Nexus Matrix" windows to prevent clutter
taskkill /FI "WINDOWTITLE eq Nexus Matrix" /F >nul 2>&1

:: Pass --deep flag to matrix_launch.bat
start "" "matrix_launch.bat" --deep

echo.
echo [SUCCESS] Deep ignition sequence started.
echo [INFO] Please wait while the system purges 50,000+ cache files.
echo.
timeout /t 5 /nobreak >nul
exit
