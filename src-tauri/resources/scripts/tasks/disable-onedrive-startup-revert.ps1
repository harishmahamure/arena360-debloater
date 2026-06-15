
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'OneDrive' -Value '"C:\Program Files\Microsoft OneDrive\OneDrive.exe" /background'
Write-Output 'success'
