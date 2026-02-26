@echo off
title Ghost Command Maintenance Tool
color 0D
echo ===================================================
echo   GHOST COMMAND MAINTENANCE & BACKUP UTILITY
echo ===================================================
echo.
echo [1] Running System Analysis...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\analyze.ps1"
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] Analysis failed. Backup aborted.
    echo Please fix the errors listed above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2] System Healthy. Starting Backup...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\backup.ps1"
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Backup failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] Ghost Command Maintenance Complete.
pause
