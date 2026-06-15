$key = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization'
$applied = $false
if (Test-Path $key) {
    $upload = Get-ItemProperty -Path $key -Name 'DOAllowUpload' -ErrorAction SilentlyContinue
    $mode = Get-ItemProperty -Path $key -Name 'DODownloadMode' -ErrorAction SilentlyContinue
    if (($upload -and $upload.DOAllowUpload -eq 0) -or ($mode -and $mode.DODownloadMode -eq 0)) {
        $applied = $true
    }
}
if ($applied) { Write-Output 'applied' } else { Write-Output 'not_applied' }
