@echo off
:: ══════════════════════════════════════════
::  CITADEL BOOT PERSISTENCE SETUP
::  Registers Citadel Guardian to start on
::  Windows login so it's always online
:: ══════════════════════════════════════════

echo.
echo   ⛊ CITADEL BOOT PERSISTENCE
echo   ═══════════════════════════
echo.

:: Method 1: Startup folder shortcut
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set VBS_PATH=g:\matrix\launchers\citadel_guardian_silent.vbs

if exist "%VBS_PATH%" (
    copy /Y "%VBS_PATH%" "%STARTUP_DIR%\citadel_guardian_silent.vbs" >nul 2>&1
    if %errorlevel% equ 0 (
        echo   [OK] Added to Windows Startup folder
        echo       %STARTUP_DIR%
    ) else (
        echo   [!!] Failed to copy to Startup folder
    )
) else (
    echo   [!!] VBS launcher not found: %VBS_PATH%
)

echo.
echo   Citadel Guardian will now start automatically
echo   on every Windows login.
echo.
echo   To remove: delete citadel_guardian_silent.vbs
echo   from your Startup folder
echo.
pause
