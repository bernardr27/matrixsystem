@echo off
REM Nexus Mobile Access Launcher
REM Starts Nexus on local network for phone access

echo.
echo ╔════════════════════════════════════════╗
echo ║   NEXUS MOBILE ACCESS LAUNCHER         ║
echo ╚════════════════════════════════════════╝
echo.
echo Starting Nexus for local network access...
echo.

REM Change to Matrix root directory
cd /d "%~dp0.."

REM Get local IP and show QR code
node scripts\mobile_access.js

echo.
echo Press any key to start Nexus server...
pause >nul

echo.
echo Starting Nexus on 0.0.0.0:3001...
echo This allows access from any device on your local network
echo.

cd apps\nexus
start "Nexus Mobile Server" cmd /k "set HOST=0.0.0.0 && npm run dev"

echo.
echo ✅ Nexus is starting!
echo.
echo The server window will open shortly.
echo Keep it running while testing on your phone.
echo.
echo To stop: Close the Nexus server window
echo.
pause
