$key = 'HKLM:\SOFTWARE\Microsoft\WcmSvc\wifinetworkmanager\config'
$applied = $false
if (Test-Path $key) {
    $val = Get-ItemProperty -Path $key -Name 'AutoConnectAllowedOEM' -ErrorAction SilentlyContinue
    if ($val -and $val.AutoConnectAllowedOEM -eq 0) { $applied = $true }
}
if (-not $applied) {
    $pol = 'HKLM:\SOFTWARE\Microsoft\PolicyManager\default\WiFi\AllowAutoConnectToWiFiSenseHotspots'
    if (Test-Path $pol) {
        $v = Get-ItemProperty -Path $pol -Name 'value' -ErrorAction SilentlyContinue
        if ($v -and $v.value -eq 0) { $applied = $true }
    }
}
if ($applied) { Write-Output 'applied' } else { Write-Output 'not_applied' }
