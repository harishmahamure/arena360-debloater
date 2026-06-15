Set-Service -Name 'WSearch' -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name 'WSearch' -ErrorAction SilentlyContinue
Write-Output 'success'
