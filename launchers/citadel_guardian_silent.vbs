' ══════════════════════════════════════════
'  CITADEL GUARDIAN — Silent/Headless Launcher
'  Runs the guardian without a visible window
'  Use this for Windows startup / scheduled tasks
' ══════════════════════════════════════════
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d ""g:\matrix\apps\citadel"" && node guardian.cjs > ""g:\matrix\logs\guardian_console.log"" 2>&1", 0, False
Set WshShell = Nothing
