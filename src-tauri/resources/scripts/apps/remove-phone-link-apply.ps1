$ErrorActionPreference = 'SilentlyContinue'
Get-AppxPackage -Name 'Microsoft.YourPhone' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like '*Microsoft.YourPhone*' | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
Write-Output 'success'
