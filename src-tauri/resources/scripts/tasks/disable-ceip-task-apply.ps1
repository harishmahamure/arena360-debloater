Disable-ScheduledTask -TaskPath '\Microsoft\Windows\Customer Experience Improvement Program\' -TaskName 'Consolidator' -ErrorAction SilentlyContinue
Write-Output 'success'
