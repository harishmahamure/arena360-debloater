$key = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\System'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$val = Get-ItemProperty -Path $key -Name 'PublishUserActivities' -ErrorAction SilentlyContinue
if ($val -and $val.'PublishUserActivities' -eq 0) { Write-Output 'applied' } else { Write-Output 'not_applied' }
