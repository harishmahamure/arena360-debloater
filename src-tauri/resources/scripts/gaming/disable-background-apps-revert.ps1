if (Test-Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications') {
    Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications' -Name 'GlobalUserDisabled' -Type DWord -Value 0
}
if (Test-Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy') {
    Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy' -Name 'LetAppsRunInBackground' -ErrorAction SilentlyContinue
}
Write-Output 'success'
