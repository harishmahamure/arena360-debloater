Stop-Service -Name 'SysMain' -Force -ErrorAction SilentlyContinue
Set-Service -Name 'SysMain' -StartupType Disabled
Write-Output 'success'
