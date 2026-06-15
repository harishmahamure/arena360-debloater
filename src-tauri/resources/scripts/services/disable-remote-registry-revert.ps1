Set-Service -Name 'RemoteRegistry' -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name 'RemoteRegistry' -ErrorAction SilentlyContinue
Write-Output 'success'
