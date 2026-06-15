$pkg = 'Microsoft.PowerAutomateDesktop'
if (Get-AppxPackage -Name $pkg -ErrorAction SilentlyContinue) { Write-Output 'not_applied' } else { Write-Output 'applied' }
