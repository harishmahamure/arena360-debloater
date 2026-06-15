
$key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$val = Get-ItemProperty $key -Name 'OneDrive' -ErrorAction SilentlyContinue
if (-not $val) { Write-Output 'applied' } else { Write-Output 'not_applied' }
