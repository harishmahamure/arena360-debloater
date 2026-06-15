$gameConfig = 'HKCU:\System\GameConfigStore'
$gameDvr = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\GameDVR'
$applied = $true
if (Test-Path $gameConfig) {
    $val = Get-ItemProperty -Path $gameConfig -Name 'GameDVR_Enabled' -ErrorAction SilentlyContinue
    if (-not $val -or $val.GameDVR_Enabled -ne 0) { $applied = $false }
} else { $applied = $false }
if (Test-Path $gameDvr) {
    $cap = Get-ItemProperty -Path $gameDvr -Name 'AppCaptureEnabled' -ErrorAction SilentlyContinue
    if ($cap -and $cap.AppCaptureEnabled -ne 0) { $applied = $false }
}
if ($applied) { Write-Output 'applied' } else { Write-Output 'not_applied' }
