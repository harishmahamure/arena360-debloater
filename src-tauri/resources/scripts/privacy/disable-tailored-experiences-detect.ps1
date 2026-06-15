$key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Privacy'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$val = Get-ItemProperty -Path $key -Name 'TailoredExperiencesWithDiagnosticDataEnabled' -ErrorAction SilentlyContinue
if ($val -and $val.'TailoredExperiencesWithDiagnosticDataEnabled' -eq 0) { Write-Output 'applied' } else { Write-Output 'not_applied' }
