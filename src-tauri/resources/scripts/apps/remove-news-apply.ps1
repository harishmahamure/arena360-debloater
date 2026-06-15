$ErrorActionPreference = 'SilentlyContinue'
Get-AppxPackage -Name 'Microsoft.BingNews' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like '*Microsoft.BingNews*' | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
Write-Output 'success'
