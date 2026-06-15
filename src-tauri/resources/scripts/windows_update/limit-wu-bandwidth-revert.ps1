Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization' -Name 'DOMaxDownloadBandwidth' -ErrorAction SilentlyContinue
Write-Output 'success'
