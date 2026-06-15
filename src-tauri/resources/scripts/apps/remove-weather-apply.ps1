$ErrorActionPreference = 'SilentlyContinue'
Get-AppxPackage -Name 'Microsoft.BingWeather' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like '*Microsoft.BingWeather*' | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
Write-Output 'success'
