@echo off
setlocal
title MATRIX CLOUD IGNITION
cd /d "%~dp0.."

echo.
echo  [MATRIX] CLOUD-ONLY LAUNCHER MODE
echo  Dispatching remote ignite to GitHub workflow...
echo.

call npm.cmd run cloud:control:enforce
call npm.cmd run local:stop:matrix
call npm.cmd run local:guard:no-listeners
if errorlevel 1 (
  echo.
  echo  [MATRIX] Local listener guard failed. Cloud ignite aborted.
  echo  Run local stop again and retry.
  echo.
  exit /b 1
)
call npm.cmd run cloud:control:ignite

echo.
echo  [MATRIX] Cloud ignite dispatched. No local servers were started.
echo.
