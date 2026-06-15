$ErrorActionPreference = 'SilentlyContinue'
foreach ($pkg in @('MSTeams', 'MicrosoftTeams')) {
    Get-AppxPackage -Name $pkg -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
    Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like "*$pkg*" | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
}
Write-Output 'success'
