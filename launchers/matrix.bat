@echo off
:: MATRIX CONTROL — Double-click to launch
:: Supports: matrix.bat [start|stop|restart|status]
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0matrix_hub.ps1" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Launcher exited with code %ERRORLEVEL%
    pause
)
