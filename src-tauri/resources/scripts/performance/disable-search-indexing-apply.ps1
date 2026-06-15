Stop-Service -Name 'WSearch' -Force -ErrorAction SilentlyContinue
Set-Service -Name 'WSearch' -StartupType Disabled -ErrorAction SilentlyContinue
Write-Output 'success'
