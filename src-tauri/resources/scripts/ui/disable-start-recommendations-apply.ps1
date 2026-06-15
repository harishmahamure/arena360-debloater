New-Item -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer' -Force | Out-Null
Set-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer' -Name 'HideRecommendedSection' -Type DWord -Value 1
Write-Output 'success'
