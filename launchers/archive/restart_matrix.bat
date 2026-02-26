@echo off
title MATRIX REBOOT PROTOCOL
echo [MATRIX] INITIATING SYSTEM RESTART...
echo [MATRIX] TERMINATING NEURAL NODES...
taskkill /F /IM node.exe
echo [MATRIX] NODES TERMINATED.
timeout /t 2 >nul
echo [MATRIX] RE-IGNITING...
start "" "launchers\matrix_boot.bat"
exit
