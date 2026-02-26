$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Matrix Hub.lnk")
$Shortcut.TargetPath = "g:\matrix\matrix.bat"
$Shortcut.WorkingDirectory = "g:\matrix"
$Shortcut.WindowStyle = 1
$Shortcut.Description = "Matrix System Control Hub"
$Shortcut.IconLocation = "C:\Windows\System32\cmd.exe"
$Shortcut.Save()
Write-Host "Shortcut created at $DesktopPath\Matrix Hub.lnk"
