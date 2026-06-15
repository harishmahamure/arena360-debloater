$s = Get-Service -Name 'WSearch' -ErrorAction SilentlyContinue
if ($s -and $s.StartType -eq 'Disabled') { Write-Output 'applied' } else { Write-Output 'not_applied' }
