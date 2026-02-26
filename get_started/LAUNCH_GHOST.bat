@echo off
title MATRIX_GHOST_COMMAND_LAUNCHER
echo [INITIALIZING] Ghost Command Sovereign Interface...
cd /d "G:\matrix\apps\ghost-command"
echo [SYNC] Linking with Matrix Telemetry...
npm run dev
pause
