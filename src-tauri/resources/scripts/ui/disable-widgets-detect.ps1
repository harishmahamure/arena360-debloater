$key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$val = Get-ItemProperty -Path $key -Name 'TaskbarDa' -ErrorAction SilentlyContinue
if ($val -and $val.'TaskbarDa' -eq 0) { Write-Output 'applied' } else { Write-Output 'not_applied' }
