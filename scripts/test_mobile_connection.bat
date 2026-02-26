@echo off
REM Quick Mobile Test - Checks if Nexus is accessible

echo.
echo ╔════════════════════════════════════════╗
echo ║   NEXUS MOBILE CONNECTIVITY TEST       ║
echo ╚════════════════════════════════════════╝
echo.

cd /d "%~dp0.."

echo [1/3] Checking if Nexus is running on port 3001...
netstat -ano | findstr ":3001" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Port 3001 is active
) else (
    echo ❌ Port 3001 is NOT active
    echo.
    echo Nexus is not running. Start it first:
    echo   Option 1: launchers\nexus_mobile.bat
    echo   Option 2: cd apps\nexus ^&^& npm run dev
    echo.
    pause
    exit /b 1
)

echo.
echo [2/3] Getting your connection info...
node scripts\mobile_access.js

echo.
echo [3/3] Testing local connection...
echo Attempting to reach http://localhost:3001...
echo.

curl -s http://localhost:3001 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Nexus is responding on localhost
    echo.
    echo ╔════════════════════════════════════════╗
    echo ║   CONNECTION TEST: PASSED              ║
    echo ╚════════════════════════════════════════╝
    echo.
    echo Your phone should be able to connect using the URL above.
    echo.
    echo If it still doesn't work:
    echo 1. Check Windows Firewall (allow Node.js)
    echo 2. Verify phone is on SAME WiFi
    echo 3. Try typing IP manually: http://192.168.12.112:3001
) else (
    echo ❌ Nexus is not responding
    echo.
    echo The port is active but not responding to HTTP requests.
    echo Nexus might still be starting up. Wait 10-20 seconds and try again.
)

echo.
pause
