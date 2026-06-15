$ErrorActionPreference = 'SilentlyContinue'
Get-AppxPackage -Name 'Microsoft.GetHelp' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like '*Microsoft.GetHelp*' | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
Write-Output 'success'
