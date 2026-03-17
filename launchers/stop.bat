@echo off
setlocal
title MATRIX LOCAL RESOURCE STOP
cd /d "%~dp0.."

echo.
echo  [MATRIX] Stopping all local Matrix processes...
echo.

call npm.cmd run local:stop:matrix
call npm.cmd run local:disable:autostart

echo.
echo  [MATRIX] Local Matrix services are offline and auto-start is disabled.
echo.
