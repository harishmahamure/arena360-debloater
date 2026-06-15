$ErrorActionPreference = 'SilentlyContinue'
Get-AppxPackage -Name 'Microsoft.XboxGamingOverlay' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like '*Microsoft.XboxGamingOverlay*' | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
Get-AppxPackage -Name 'Microsoft.Xbox.TCUI' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like '*Microsoft.Xbox.TCUI*' | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
Get-AppxPackage -Name 'Microsoft.XboxApp' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like '*Microsoft.XboxApp*' | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
Write-Output 'success'
