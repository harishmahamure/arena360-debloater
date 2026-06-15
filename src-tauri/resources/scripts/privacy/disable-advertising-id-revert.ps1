New-Item -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo' -Force | Out-Null
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo' -Name 'Enabled' -Type DWord -Value 1
Write-Output 'success'
