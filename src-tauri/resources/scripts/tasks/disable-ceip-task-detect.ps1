$t = Get-ScheduledTask -TaskPath '\Microsoft\Windows\Customer Experience Improvement Program\' -TaskName 'Consolidator' -ErrorAction SilentlyContinue
if ($t -and $t.State -eq 'Disabled') { Write-Output 'applied' } else { Write-Output 'not_applied' }
