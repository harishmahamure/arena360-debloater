New-Item -Path 'HKCU:\Software\Microsoft\GameBar' -Force | Out-Null
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\GameBar' -Name 'AutoGameModeEnabled' -Type DWord -Value 1
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\GameBar' -Name 'AllowAutoGameMode' -Type DWord -Value 1
Write-Output 'success'
