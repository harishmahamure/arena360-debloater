$t = Get-ScheduledTask -TaskPath '\Microsoft\Windows\Feedback\Siuf\' -TaskName 'DmClient' -ErrorAction SilentlyContinue
if ($t -and $t.State -eq 'Disabled') { Write-Output 'applied' } else { Write-Output 'not_applied' }
