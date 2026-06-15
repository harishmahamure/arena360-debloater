if (Test-Path 'HKLM:\SOFTWARE\Microsoft\WcmSvc\wifinetworkmanager\config') {
    Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\WcmSvc\wifinetworkmanager\config' -Name 'AutoConnectAllowedOEM' -ErrorAction SilentlyContinue
}
if (Test-Path 'HKLM:\SOFTWARE\Microsoft\PolicyManager\default\WiFi\AllowAutoConnectToWiFiSenseHotspots') {
    Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\PolicyManager\default\WiFi\AllowAutoConnectToWiFiSenseHotspots' -Name 'value' -ErrorAction SilentlyContinue
}
Write-Output 'success'
