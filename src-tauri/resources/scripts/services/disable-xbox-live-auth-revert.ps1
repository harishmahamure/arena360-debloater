Set-Service -Name 'XblAuthManager' -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name 'XblAuthManager' -ErrorAction SilentlyContinue
Write-Output 'success'
