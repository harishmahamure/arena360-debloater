$key = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$val = Get-ItemProperty -Path $key -Name 'DOMaxDownloadBandwidth' -ErrorAction SilentlyContinue
if ($val -and $val.'DOMaxDownloadBandwidth' -eq 500) { Write-Output 'applied' } else { Write-Output 'not_applied' }
