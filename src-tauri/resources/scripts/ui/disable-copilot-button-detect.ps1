$key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$val = Get-ItemProperty -Path $key -Name 'ShowCopilotButton' -ErrorAction SilentlyContinue
if ($val -and $val.'ShowCopilotButton' -eq 0) { Write-Output 'applied' } else { Write-Output 'not_applied' }
