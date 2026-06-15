$s = Get-Service -Name 'XblAuthManager' -ErrorAction SilentlyContinue
if ($s -and $s.StartType -eq 'Disabled') { Write-Output 'applied' } else { Write-Output 'not_applied' }
