New-Item -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Privacy' -Force | Out-Null
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Privacy' -Name 'TailoredExperiencesWithDiagnosticDataEnabled' -Type DWord -Value 0
Write-Output 'success'
