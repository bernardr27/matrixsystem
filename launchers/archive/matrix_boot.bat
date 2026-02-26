@echo off
cd /d "%~dp0.."
title MATRIX BOOTLOADER

:: --- AUTO-LOGISTICS: CLEANUP ---
echo [MATRIX] Clearing previous sessions...
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

echo.
echo [MATRIX] SYSTEM INITIALIZATION
echo [MATRIX] Verifying Integrity...
echo.

:: Run Doctor Check
node scripts\tools\matrix_doctor.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [CRITICAL] SYSTEM INSTABILITY DETECTED.
    echo [MATRIX] Recommendation: Perform System Maintenance.
    echo.
    choice /C YN /M "Initiate Maintenance Protocol? (Y=Repair, N=Ignored Risk)"
    if errorlevel 2 goto :FORCE_BOOT
    if errorlevel 1 goto :MAINTENANCE
)

:BOOT
echo.
echo [MATRIX] ALL SYSTEMS GREEN.
echo [MATRIX] Handing over to Reflect OS Launcher...
echo.
timeout /t 2 >nul
call launchers\ReflectLauncher.bat
goto :EOF

:FORCE_BOOT
echo.
echo [WARNING] BYPASSING SAFEGUARDS.
echo [WARNING] SYSTEM INSTABILITY MAY OCCUR.
echo.
timeout /t 2 >nul
call launchers\ReflectLauncher.bat
goto :EOF

:MAINTENANCE
echo.
echo [MATRIX] Transferring to Maintenance Deck...
echo.
call launchers\matrix_maintenance.bat
echo.
echo [MATRIX] Maintenance Complete. Rebooting...
echo.
timeout /t 2 >nul
goto :BOOT
