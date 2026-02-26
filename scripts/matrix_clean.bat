@echo off
:: MATRIX CLEAN - Universal Purge Wrapper
:: Forces termination of all Matrix-relevant node processes and frees ports.

title MATRIX PURGE
pushd "%~dp0"

set SKIP_PID=%1
if "%SKIP_PID%"=="" set SKIP_PID=0

echo.
echo  [!] INITIATING SYSTEM-WIDE PURGE (Excluding PID: %SKIP_PID%)...
echo.

powershell -ExecutionPolicy Bypass -File .\zombie_purge.ps1 -SkipPid %SKIP_PID%

echo.
echo  [+] PURGE COMPLETE. Environment pristine.
echo.
popd
timeout /t 2 /nobreak >nul
