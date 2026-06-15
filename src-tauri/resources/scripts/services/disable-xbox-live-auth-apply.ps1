Stop-Service -Name 'XblAuthManager' -Force -ErrorAction SilentlyContinue
Set-Service -Name 'XblAuthManager' -StartupType Disabled
Write-Output 'success'
