Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "g:\matrix"
WshShell.Run "cmd /c npm run local:stop:matrix > logs\\sentinel_boot.log 2>&1 & npm run cloud:control:ignite >> logs\\sentinel_boot.log 2>&1", 0, False
Set WshShell = Nothing
