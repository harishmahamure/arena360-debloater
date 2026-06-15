Set-Service -Name 'DiagTrack' -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name 'DiagTrack' -ErrorAction SilentlyContinue
Write-Output 'success'
