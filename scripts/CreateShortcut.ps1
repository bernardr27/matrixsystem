$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
$ShortcutPath = Join-Path $DesktopPath "REFLECT OS.lnk"
$TargetPath = "g:\test_v2\ReflectLauncher.bat"
$IconPath = "g:\test_v2\app\public\favicon.ico" # Fallback to generic if not found

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = "/c `"$TargetPath`""
$Shortcut.WorkingDirectory = "g:\test_v2"
$Shortcut.Description = "Launch REFLECT OS Neural Hubbard"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
}
$Shortcut.Save()

Write-Host "Shortcut created at: $ShortcutPath"
