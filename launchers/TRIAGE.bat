@echo off
title Matrix Triage System
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║                         MATRIX TRIAGE SYSTEM                              ║
echo ║                   Self-Healing Codebase Analysis Engine                   ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0.."

if "%1"=="" (
    echo USAGE: TRIAGE.bat ^<module^> ^<app^> [options]
    echo.
    echo MODULES:
    echo   evolve ^<app^>     Scan for UI/UX improvements
    echo   purge ^<app^>      Find and fix code issues
    echo   oracle ^<app^>     Generate comprehensive audit
    echo   full ^<app^>       Run all modules
    echo.
    echo OPTIONS:
    echo   --fix            Apply auto-fixes where possible
    echo   --dry-run        Preview changes without applying
    echo.
    echo APPS: reflect, nexus, ghost-command
    echo.
    echo EXAMPLES:
    echo   TRIAGE.bat evolve reflect
    echo   TRIAGE.bat purge reflect --fix
    echo   TRIAGE.bat oracle nexus
    echo   TRIAGE.bat full reflect
    echo.
    pause
    exit /b
)

echo [TRIAGE] Running: %*
echo.

node apps\ghost-command\core\triage.cjs %*

echo.
echo [TRIAGE] Complete.
pause
