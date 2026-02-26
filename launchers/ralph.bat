@echo off
:: ╔══════════════════════════════════════════════╗
:: ║  RALPH — Recursive Autonomous Loop Launcher ║
:: ║  Usage:                                       ║
:: ║    ralph.bat                (interactive)     ║
:: ║    ralph.bat --prd FILE.md  (PRD loop)        ║
:: ║    ralph.bat Build a thing  (freeform)        ║
:: ╚══════════════════════════════════════════════╝
setlocal enabledelayedexpansion

set "ROOT=%~dp0.."
cd /d "%ROOT%"

title RALPH — Matrix Coding Agent v3.0

:: Forward all args to ralph.mjs
node "%ROOT%\apps\ralph\ralph.mjs" %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [RALPH] Exited with error code %ERRORLEVEL%
    pause
)
endlocal
