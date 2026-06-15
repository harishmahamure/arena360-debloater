New-Item -Path 'HKCU:\System\GameConfigStore' -Force | Out-Null
Set-ItemProperty -Path 'HKCU:\System\GameConfigStore' -Name 'GameDVR_DXGIHonorFSEWindowsCompatible' -Type DWord -Value 1
Set-ItemProperty -Path 'HKCU:\System\GameConfigStore' -Name 'GameDVR_FSEBehaviorMode' -Type DWord -Value 2
Set-ItemProperty -Path 'HKCU:\System\GameConfigStore' -Name 'GameDVR_HonorUserFSEBehaviorMode' -Type DWord -Value 1
Write-Output 'success'
