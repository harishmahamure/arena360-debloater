$key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$val = Get-ItemProperty -Path $key -Name 'SubscribedContent-338387Enabled' -ErrorAction SilentlyContinue
if ($val -and $val.'SubscribedContent-338387Enabled' -eq 0) { Write-Output 'applied' } else { Write-Output 'not_applied' }
