$key = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$val = Get-ItemProperty -Path $key -Name 'HideRecommendedSection' -ErrorAction SilentlyContinue
if ($val -and $val.'HideRecommendedSection' -eq 1) { Write-Output 'applied' } else { Write-Output 'not_applied' }
