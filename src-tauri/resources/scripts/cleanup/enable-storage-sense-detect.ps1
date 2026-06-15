$k='HKCU:\Software\Microsoft\Windows\CurrentVersion\StorageSense\Parameters\StoragePolicy'
if ((Get-ItemProperty $k -Name '01' -ErrorAction SilentlyContinue).'01' -eq 1) { Write-Output 'applied' } else { Write-Output 'not_applied' }
