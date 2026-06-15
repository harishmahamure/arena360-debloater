Remove-Item -Path C:\Windows\ServiceProfiles\NetworkService\AppData\Local\Microsoft\Windows\DeliveryOptimization\Cache\* -Recurse -Force -ErrorAction SilentlyContinue
Write-Output 'success'
