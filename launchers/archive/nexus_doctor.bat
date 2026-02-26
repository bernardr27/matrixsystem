@echo off
title Nexus Doctor - System Diagnostic Tool
color 0B
echo.
echo  =========================================
echo       NEXUS DOCTOR - SYSTEM SCAN
echo  =========================================
echo.
echo  Initializing diagnostic protocols...
echo.

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [CRITICAL] Node.js is NOT installed or not in PATH.
    echo  Please install Node.js to proceed.
    pause
    exit
)

:: Set Root Directory
cd /d "%~dp0.."

:: Run Diagnostic Script
node scripts\tools\nexus_doctor.js

echo.
echo  =========================================
echo  Diagnostic run complete.
echo  Report saved to diagnostic_report.json
echo  =========================================
echo.
pause
