Set-Service -Name 'SysMain' -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name 'SysMain' -ErrorAction SilentlyContinue
Write-Output 'success'
