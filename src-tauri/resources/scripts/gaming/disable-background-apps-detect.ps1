$key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications'
$policy = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\AppPrivacy'
$applied = $false
if (Test-Path $key) {
    $val = Get-ItemProperty -Path $key -Name 'GlobalUserDisabled' -ErrorAction SilentlyContinue
    if ($val -and $val.GlobalUserDisabled -eq 1) { $applied = $true }
}
if (-not $applied -and (Test-Path $policy)) {
    $pol = Get-ItemProperty -Path $policy -Name 'LetAppsRunInBackground' -ErrorAction SilentlyContinue
    if ($pol -and $pol.LetAppsRunInBackground -eq 2) { $applied = $true }
}
if ($applied) { Write-Output 'applied' } else { Write-Output 'not_applied' }
