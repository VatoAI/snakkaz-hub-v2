# Create the scheduled task action
$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c C:\Users\stian\Desktop\SnakkaZ V2\snakkaz-hub-v2\src\scripts\cleanup-presence.bat" -WorkingDirectory "C:\Users\stian\Desktop\SnakkaZ V2\snakkaz-hub-v2\src\scripts"

# Create the trigger (runs every 5 minutes)
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration ([TimeSpan]::MaxValue)

# Set up the task principal
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Register the scheduled task
Register-ScheduledTask -TaskName "SnakkaZ Presence Cleanup" -Action $Action -Trigger $Trigger -Principal $Principal -Description "Cleans up stale user presence records every 5 minutes" 