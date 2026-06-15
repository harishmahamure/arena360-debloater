New-Item -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize' -Force | Out-Null
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize' -Name 'EnableTransparency' -Type DWord -Value 1
New-Item -Path 'HKCU:\Control Panel\Desktop\WindowMetrics' -Force | Out-Null
Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop\WindowMetrics' -Name 'MinAnimate' -Type String -Value '1'
Write-Output 'success'
