$ErrorActionPreference = 'SilentlyContinue'
Get-AppxPackage -Name 'Clipchamp.Clipchamp' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like '*Clipchamp.Clipchamp*' | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
Write-Output 'success'
