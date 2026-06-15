Disable-ScheduledTask -TaskPath '\Microsoft\Windows\Feedback\Siuf\' -TaskName 'DmClient' -ErrorAction SilentlyContinue
Write-Output 'success'
