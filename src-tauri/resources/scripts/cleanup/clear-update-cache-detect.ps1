if (Test-Path 'C:\Windows\SoftwareDistribution\Download') { Write-Output 'not_applied' } else { Write-Output 'applied' }
