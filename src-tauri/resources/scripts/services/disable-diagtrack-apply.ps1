Stop-Service -Name 'DiagTrack' -Force -ErrorAction SilentlyContinue
Set-Service -Name 'DiagTrack' -StartupType Disabled
Write-Output 'success'
