@echo off
setlocal
cd /d "%~dp0.."

if not exist "logs" mkdir "logs"
echo [%DATE% %TIME%] cloud_only_redirect launch_silent.bat>>logs\startup.log

call npm.cmd run local:stop:matrix >>logs\matrix_session.log 2>&1
call npm.cmd run cloud:control:ignite >>logs\matrix_session.log 2>&1

exit /b 0
