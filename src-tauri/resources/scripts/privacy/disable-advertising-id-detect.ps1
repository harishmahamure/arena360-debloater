$key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$val = Get-ItemProperty -Path $key -Name 'Enabled' -ErrorAction SilentlyContinue
if ($val -and $val.'Enabled' -eq 0) { Write-Output 'applied' } else { Write-Output 'not_applied' }
