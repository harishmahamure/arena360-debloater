Stop-Service -Name 'RemoteRegistry' -Force -ErrorAction SilentlyContinue
Set-Service -Name 'RemoteRegistry' -StartupType Disabled
Write-Output 'success'
