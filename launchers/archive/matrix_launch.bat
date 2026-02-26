@echo off
cd /d "%~dp0.."
title MATRIX_IGNITION_SEQUENCE

:: --- AUTO-LOGISTICS: CLEANUP ---
echo [MATRIX] Clearing previous sessions...
taskkill /F /FI "WINDOWTITLE eq Nexus Matrix" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Reflect Launcher" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq SENTINEL_GUARD" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq GHOST_RUNNER" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq REFLECT_OS" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq GHOST_OS" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq NEXUS_HUB" >nul 2>&1
timeout /t 3 /nobreak >nul

title Nexus Matrix
echo [NEXUS] SYSTEM IGNITION...
echo ----------------------------------
echo [1/2] Checking for stasis compatibility...
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [CRIT] Node.js core not found.
    pause
    exit /b
)

if "%1"=="--deep" (
    echo [SYS] EXECUTING DEEP PURGE...
    node core\sentinel.cjs --purge >nul 2>&1
    echo [SYS] Thermal cooling... (3s)
    timeout /t 3 /nobreak >nul
)

:RESTART
cls
echo [NEXUS] SYSTEM IGNITION...
echo ----------------------------------
echo [SYS] Clearing neural cache...
node core\sentinel.cjs --purge >nul 2>&1

echo [SYS] Igniting core node...
node core\sentinel.cjs --boot

set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% EQU 10 (
    echo [WARN] Neural link collision detected.
    echo [SYS] Performing deep purge and retrying...
    node core\sentinel.cjs --purge
    timeout /t 1 /nobreak >nul
    goto RESTART
)

if %EXIT_CODE% NEQ 0 (
    echo [CRIT] Sentinel collapsed (Code: %EXIT_CODE%).
    echo [SYS] Cooling protocols active... (2s)
    timeout /t 2 /nobreak >nul
    echo [SYS] Re-igniting core...
    node core\sentinel.cjs --purge
    goto RESTART
) else (
    echo [SYS] System Halted.
    pause
)
