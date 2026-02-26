@echo on
title MATRIX MONOLITH SERVER
color 0b

:BOOT_SEQUENCE
echo.
echo ===============================================================================
echo   THE MATRIX IO | SYSTEM MONOLITH
echo   HEADLESS SERVER ENVIRONMENT
echo ===============================================================================
echo.
echo   [1] Initializing Sentinel Core...
echo   [DEBUG] Path: %CD%

if not exist "node_modules" (
    echo   [!] node_modules missing. Installing...
    call npm install
)

echo   [2] Igniting Neural Network...
node core/sentinel.cjs --headless

echo.
echo   [!] SENTINEL DISENGAGED
echo   [!] Exit Code: %ERRORLEVEL%
echo.
pause
goto BOOT_SEQUENCE
