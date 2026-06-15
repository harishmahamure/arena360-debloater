$key = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization'
if (Test-Path $key) {
    Remove-ItemProperty -Path $key -Name 'DOAllowUpload' -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path $key -Name 'DODownloadMode' -ErrorAction SilentlyContinue
}
Write-Output 'success'
