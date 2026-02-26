@echo off
setlocal EnableDelayedExpansion
:: MATRIX HEADLESS IGNITION — Silent Background Mode
title MATRIX_HEADLESS
cd /d "%~dp0.."

:: Single-instance safety guard
set "LOCK_FILE=logs\start_headless.lock"
set "IS_RUNNING="

for %%P in (3000 3001 3005 4000 5173) do (
    powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %%P -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
    if not errorlevel 1 set "IS_RUNNING=1"
)

if exist "%LOCK_FILE%" (
    if defined IS_RUNNING (
        if not exist "logs" mkdir logs
        echo [%DATE% %TIME%] HEADLESS_GUARD: Existing lock + active services. Duplicate start blocked.>> logs\startup.log
        echo [GUARD] Headless launcher already active. Aborting duplicate start.
        exit /b 0
    ) else (
        del /q "%LOCK_FILE%" >nul 2>&1
    )
)

if defined IS_RUNNING (
    if not exist "logs" mkdir logs
    echo [%DATE% %TIME%] HEADLESS_GUARD: Services already running. Duplicate start blocked.>> logs\startup.log
    echo [GUARD] Matrix services already running. Aborting duplicate start.
    exit /b 0
)

:: Create logs directory if not exists
if not exist "logs" mkdir logs
echo [%DATE% %TIME%] %RANDOM% > "%LOCK_FILE%"

:: ─── PHASE 1: CLEAN STATE ───
call launchers\stop.bat >nul 2>&1

:: ─── PHASE 2: LAUNCH SERVICES (Headless) ───
echo [%DATE% %TIME%] Starting Headless Ignition... > logs\startup.log

:: Sentinel
start /b node apps\ghost-command\core\sentinel.cjs > logs\sentinel.log 2>&1

:: Ghost Runner
start /b node apps\ghost-command\core\ghost-runner.cjs > logs\ghost_runner.log 2>&1

:: Reflect (Port 3000)
cd apps\reflect
start /b npm start > ..\..\logs\reflect.log 2>&1
cd ..\..

:: Nexus (Port 3001)
cd apps\nexus
start /b npm start > ..\..\logs\nexus.log 2>&1
cd ..\..

:: Ghost Command (Port 5173)
cd apps\ghost-command
start /b npm start > ..\..\logs\ghost_command.log 2>&1
cd ..\..

echo [%DATE% %TIME%] All services triggered. >> logs\startup.log

:: Keep the hidden window open so child processes do not die
cmd /k
