@echo off
title MATRIX KILL SWITCH
color 0C

echo.
echo   [!] INITIATING EMERGENCY SHUTDOWN...
echo.

taskkill /F /IM node.exe /T >nul 2>&1
echo   [x] Node.js Processes Terminated.

taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq SENTINEL*" >nul 2>&1
echo   [x] Sentinel Terminated.

taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq MATRIX*" >nul 2>&1
echo   [x] Matrix Server Terminated.

echo.
echo   [SYSTEM CLEAN]
echo   You may now restart the server.
echo.
pause
