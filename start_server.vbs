Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c start_server.bat", 0
Set WshShell = Nothing