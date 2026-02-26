@echo off
title REFLECT OS MAINTENANCE
cd /d "g:\test_v2\app"

:MENU
cls
echo ========================================================
echo        REFLECT OS // MAINTENANCE UNIT
echo ========================================================
echo.
echo  [1] ANALYZE SYSTEM    (Lint, Audit, Build)
echo  [2] CREATE BACKUP     (Snapshot to g:\test_v2\app_backups)
echo  [0] EXIT
echo.
echo ========================================================
choice /C 120 /M "Select Operation:"

if errorlevel 3 goto :EOF
if errorlevel 2 goto :BACKUP
if errorlevel 1 goto :ANALYZE

:ANALYZE
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\analyze.ps1"
echo.
pause
goto :MENU

:BACKUP
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\backup.ps1"
echo.
pause
goto :MENU
