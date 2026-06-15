$key = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$val = Get-ItemProperty -Path $key -Name 'NoAutoRebootWithLoggedOnUsers' -ErrorAction SilentlyContinue
if ($val -and $val.'NoAutoRebootWithLoggedOnUsers' -eq 1) { Write-Output 'applied' } else { Write-Output 'not_applied' }
