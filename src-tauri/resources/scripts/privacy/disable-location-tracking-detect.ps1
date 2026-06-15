$key = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$val = Get-ItemProperty -Path $key -Name 'Value' -ErrorAction SilentlyContinue
if ($val -and $val.'Value' -eq 'Deny') { Write-Output 'applied' } else { Write-Output 'not_applied' }
