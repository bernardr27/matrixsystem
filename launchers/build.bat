@echo off
setlocal EnableDelayedExpansion
title MATRIX BUILDER
cd /d "%~dp0.."

:: Argument checking
if "%1"=="reflect" goto BUILD_REFLECT
if "%1"=="nexus" goto BUILD_NEXUS
if "%1"=="ghost" goto BUILD_GHOST
if "%1"=="rocket" goto BUILD_ROCKET
if "%1"=="all" goto BUILD_ALL

:MENU
cls
echo.
echo  ╔══════════════════════════════════════════╗
10: echo  ║          MATRIX BUILD SYSTEM v2.0        ║
11: echo  ╚══════════════════════════════════════════╝
echo.
echo   [1] Build ALL (Full Production Sync)
echo   [2] Build REFLECT ONLY (Port 3000)
echo   [3] Build NEXUS ONLY   (Port 3001)
echo   [4] Build GHOST CMD    (Port 5173)
echo   [5] Build ROCKET CMD   (Port 4000)
echo.
echo   [0] Back to Master Control
echo.
set /p choice="Selection: "

if "%choice%"=="1" goto BUILD_ALL
if "%choice%"=="2" goto BUILD_REFLECT
if "%choice%"=="3" goto BUILD_NEXUS
if "%choice%"=="4" goto BUILD_GHOST
if "%choice%"=="5" goto BUILD_ROCKET
if "%choice%"=="0" exit /b
goto MENU

:BUILD_ALL
echo.
echo  [1/4] Building Reflect OS...
call :COMPILE apps\reflect
echo.
echo  [2/4] Building Nexus Hub...
call :COMPILE apps\nexus
echo.
echo  [3/4] Building Ghost Command...
call :COMPILE apps\ghost-command
echo.
echo  [4/4] Building Rocket Command...
call :COMPILE apps\rocket-command
goto FINISH

:BUILD_REFLECT
echo.
echo  [ACTION] Building Reflect OS...
call :COMPILE apps\reflect
goto FINISH

:BUILD_NEXUS
echo.
echo  [ACTION] Building Nexus Hub...
call :COMPILE apps\nexus
goto FINISH

:BUILD_GHOST
echo.
echo  [ACTION] Building Ghost Command...
call :COMPILE apps\ghost-command
goto FINISH

:BUILD_ROCKET
echo.
echo  [ACTION] Building Rocket Command...
call :COMPILE apps\rocket-command
goto FINISH

:COMPILE
set APP_PATH=%1
echo  ──────────────────────────────────────────
echo   TARGET: %APP_PATH%
echo  ──────────────────────────────────────────
pushd "%APP_PATH%"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Build failed for %APP_PATH%
    pause
    popd
    exit /b %ERRORLEVEL%
)
popd
goto :eof

:FINISH
echo.
echo  ══════════════════════════════════════════
echo   BUILD SEQUENCE COMPLETE.
echo  ══════════════════════════════════════════
echo.
pause
exit /b
