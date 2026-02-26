$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')

echo "Creating shortcuts on: $DesktopPath"

# 1. Nexus Matrix Launcher (Batch File)
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Nexus Matrix.lnk")
$Shortcut.TargetPath = "g:\test_v2\matrix_launch.bat"
$Shortcut.WorkingDirectory = "g:\test_v2"
$Shortcut.WindowStyle = 1 # Normal
$Shortcut.Description = "Launch Nexus Matrix Mode (All Servers)"
$Shortcut.IconLocation = "cmd.exe"
$Shortcut.Save()
echo "Verified: Nexus Matrix.lnk"

# 2. Nexus Dashboard (URL)
$UrlShortcut = $WshShell.CreateShortcut("$DesktopPath\Nexus Dashboard.url")
$UrlShortcut.TargetPath = "http://localhost:3001"
$UrlShortcut.Save()
echo "Verified: Nexus Dashboard.url"

# 3. Clean Restart (Optional logic, maybe useful)
$CleanShortcut = $WshShell.CreateShortcut("$DesktopPath\Nexus Clean Restart.lnk")
$CleanShortcut.TargetPath = "g:\test_v2\clean_restart.bat"
$CleanShortcut.WorkingDirectory = "g:\test_v2"
$CleanShortcut.Description = "Force Kill & Restart"
$CleanShortcut.IconLocation = "imageres.dll,3" # Folder icon or swap to something else
$CleanShortcut.Save()
echo "Verified: Nexus Clean Restart.lnk"
