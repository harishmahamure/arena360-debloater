$key = 'HKCU:\Software\Microsoft\GameBar'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$auto = Get-ItemProperty -Path $key -Name 'AutoGameModeEnabled' -ErrorAction SilentlyContinue
$allow = Get-ItemProperty -Path $key -Name 'AllowAutoGameMode' -ErrorAction SilentlyContinue
if ($auto -and $auto.AutoGameModeEnabled -eq 1 -and $allow -and $allow.AllowAutoGameMode -eq 1) {
    Write-Output 'applied'
} else {
    Write-Output 'not_applied'
}
