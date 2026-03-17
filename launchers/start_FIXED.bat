@echo off
setlocal
cd /d "%~dp0.."

echo.
echo  [MATRIX] CLOUD-ONLY LAUNCHER MODE (LEGACY REDIRECT)
echo  Dispatching remote ignite. Local services stay off.
echo.

call npm.cmd run local:stop:matrix
call npm.cmd run cloud:control:ignite

exit /b 0
