@echo off
:: ══════════════════════════════════════════
::  CITADEL GUARDIAN LAUNCHER
::  Starts the immortal watchdog that keeps
::  Citadel online and publicly accessible
:: ══════════════════════════════════════════

title Citadel Guardian
cd /d "g:\matrix\apps\citadel"
echo.
echo   Starting Citadel Guardian...
echo   Citadel will auto-restart if it crashes
echo   Cloudflare tunnel will maintain public access
echo.
node guardian.cjs %*
pause
