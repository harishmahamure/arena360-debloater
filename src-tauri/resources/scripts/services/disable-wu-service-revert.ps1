Set-Service -Name 'wuauserv' -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name 'wuauserv' -ErrorAction SilentlyContinue
Write-Output 'success'
