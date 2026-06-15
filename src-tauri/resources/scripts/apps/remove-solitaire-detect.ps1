$packages = @('Microsoft.MicrosoftSolitaireCollection')
$installed = $false
foreach ($pkg in $packages) {
    if (Get-AppxPackage -Name $pkg -ErrorAction SilentlyContinue) { $installed = $true; break }
}
if (-not $installed) { Write-Output 'applied' } else { Write-Output 'not_applied' }
