New-Item -Path 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings' -Force | Out-Null
Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings' -Name 'PauseUpdatesExpiryTime' -Type String -Value '2099-12-31T00:00:00Z'
Write-Output 'success'
