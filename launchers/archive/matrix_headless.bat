@echo off
cd /d "%~dp0.."
title MATRIX HEADLESS SERVER
color 0A

echo.
echo [MATRIX] HEADLESS MODE ENGAGED
echo [MATRIX] Initializing Sentinel Core...
echo.

:: Launch Sentinel in Headless + Boot mode
:: This triggers the 'sys:ignite' sequence automatically without GUI
node core\sentinel.cjs --headless --boot

echo.
echo [MATRIX] SENTINEL TERMINATED.
pause
