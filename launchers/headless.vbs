Set WshShell = CreateObject("WScript.Shell") 
' Launch start.bat with output redirected to log file, window hidden (0)
WshShell.Run "cmd /c launch_silent.bat", 0
Set WshShell = Nothing
