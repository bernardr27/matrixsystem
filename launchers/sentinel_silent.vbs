' MATRIX SENTINEL — Silent Launcher
' Starts Sentinel with ZERO console windows.
' Uses vbHide (0) which prevents any console from being allocated
' for the process tree, so child spawns also stay invisible.

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "g:\matrix"
' Redirect stdout and stderr to sentinel_boot.log for background debugging
WshShell.Run "cmd /c node apps/ghost-command/core/sentinel.cjs --headless > apps/ghost-command/core/sentinel_boot.log 2>&1", 0, False
