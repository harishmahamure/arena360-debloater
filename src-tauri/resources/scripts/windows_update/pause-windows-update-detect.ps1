$key = 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$val = Get-ItemProperty -Path $key -Name 'PauseUpdatesExpiryTime' -ErrorAction SilentlyContinue
if ($val -and $val.'PauseUpdatesExpiryTime' -eq '2099-12-31T00:00:00Z') { Write-Output 'applied' } else { Write-Output 'not_applied' }
