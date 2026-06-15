$key = 'HKCU:\System\GameConfigStore'
if (-not (Test-Path $key)) { Write-Output 'not_applied'; exit 0 }
$honor = Get-ItemProperty -Path $key -Name 'GameDVR_DXGIHonorFSEWindowsCompatible' -ErrorAction SilentlyContinue
$behavior = Get-ItemProperty -Path $key -Name 'GameDVR_FSEBehaviorMode' -ErrorAction SilentlyContinue
$user = Get-ItemProperty -Path $key -Name 'GameDVR_HonorUserFSEBehaviorMode' -ErrorAction SilentlyContinue
if ($honor -and $honor.GameDVR_DXGIHonorFSEWindowsCompatible -eq 1 -and
    $behavior -and $behavior.GameDVR_FSEBehaviorMode -eq 2 -and
    $user -and $user.GameDVR_HonorUserFSEBehaviorMode -eq 1) {
    Write-Output 'applied'
} else {
    Write-Output 'not_applied'
}
