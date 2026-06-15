$pkg = 'Microsoft.WindowsDevHome'
if (Get-AppxPackage -Name $pkg -ErrorAction SilentlyContinue) { Write-Output 'not_applied' } else { Write-Output 'applied' }
