' Create Matrix Hub Desktop Shortcut
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get desktop path
strDesktop = objShell.SpecialFolders("Desktop")

' Matrix root (robust location resolution)
strScriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
strMatrixRoot = objFSO.GetAbsolutePathName(strScriptDir & "\..") & "\"

' Create shortcut
Set objShortcut = objShell.CreateShortcut(strDesktop & "\Matrix Hub.lnk")
objShortcut.TargetPath = "powershell.exe"
objShortcut.Arguments = "-ExecutionPolicy Bypass -File """ & strMatrixRoot & "launchers\matrix_hub_v7.ps1"""
objShortcut.WorkingDirectory = strMatrixRoot
objShortcut.Description = "Matrix Control System - Application Hub"
objShortcut.WindowStyle = 1
objShortcut.Save

' Success message
WScript.Echo "✅ Desktop shortcut created: Matrix Hub.lnk"
