if (Test-Path 'HKCU:\System\GameConfigStore') {
    Remove-ItemProperty -Path 'HKCU:\System\GameConfigStore' -Name 'GameDVR_DXGIHonorFSEWindowsCompatible' -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path 'HKCU:\System\GameConfigStore' -Name 'GameDVR_FSEBehaviorMode' -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path 'HKCU:\System\GameConfigStore' -Name 'GameDVR_HonorUserFSEBehaviorMode' -ErrorAction SilentlyContinue
}
Write-Output 'success'
