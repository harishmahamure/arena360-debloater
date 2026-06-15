$ErrorActionPreference = 'SilentlyContinue'
Get-AppxPackage -Name 'Microsoft.MicrosoftSolitaireCollection' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like '*Microsoft.MicrosoftSolitaireCollection*' | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
Write-Output 'success'
