@echo off
:: Set Correct Working Directory (Resolves "launchers" path issues)
cd /d "%~dp0"
:: Launches the Premium Matrix Hub
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Maximized -File "launchers\matrix_hub.ps1"
