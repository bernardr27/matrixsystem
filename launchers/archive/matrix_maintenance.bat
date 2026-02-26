@echo off
cd /d "%~dp0.."
title MATRIX_MAINTENANCE_PROTOCOL
cls

echo ===================================================
echo   MATRIX MAINTENANCE PROTOCOL (MMP) v1.0
echo ===================================================
echo [WARNING] This sequence will TERMINATE all servers.
echo [STATUS] Deep cleaning and self-healing in progress...
echo.

:: Run the PowerShell Engine
powershell -ExecutionPolicy Bypass -File scripts\matrix_maintenance.ps1

echo.
echo [COMPLETE] Maintenance sequence finished.
echo [INFO] System is now in a "Golden State."
echo.
set /p START_ALL="Re-ignite all systems now? (y/n): "

if /i "%START_ALL%"=="y" (
    echo [IGNITION] Starting Matrix System...
    start "" "launchers\matrix_launch.bat"
) else (
    echo [HALTED] System remains in stasis.
)

pause
exit
