@echo off
:: MATRIX CONTROL
:: Default (no args): cloud-only ignite path without hub popups.
if "%~1"=="" (
    call "%~dp0start.bat"
    exit /b %ERRORLEVEL%
)

:: Advanced mode with explicit args still routes to hub command mode.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0matrix_hub.ps1" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Launcher exited with code %ERRORLEVEL%
    pause
)
