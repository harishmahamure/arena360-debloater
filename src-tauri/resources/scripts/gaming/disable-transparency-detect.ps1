$personalize = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize'
$desktop = 'HKCU:\Control Panel\Desktop\WindowMetrics'
$applied = $true
if (Test-Path $personalize) {
    $val = Get-ItemProperty -Path $personalize -Name 'EnableTransparency' -ErrorAction SilentlyContinue
    if (-not $val -or $val.EnableTransparency -ne 0) { $applied = $false }
} else { $applied = $false }
if (Test-Path $desktop) {
    $anim = Get-ItemProperty -Path $desktop -Name 'MinAnimate' -ErrorAction SilentlyContinue
    if ($anim -and $anim.MinAnimate -ne '0') { $applied = $false }
}
if ($applied) { Write-Output 'applied' } else { Write-Output 'not_applied' }
