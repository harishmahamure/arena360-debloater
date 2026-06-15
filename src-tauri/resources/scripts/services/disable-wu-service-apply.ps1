Stop-Service -Name 'wuauserv' -Force -ErrorAction SilentlyContinue
Set-Service -Name 'wuauserv' -StartupType Disabled
Write-Output 'success'
