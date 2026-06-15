param([string]$EntryJson)

$ErrorActionPreference = 'SilentlyContinue'
. (Join-Path $PSScriptRoot 'appx-remove-helper.ps1')

$entry = $EntryJson | ConvertFrom-Json

if ($entry.packageName) {
    $result = Remove-SafeAppxPackage -PackageName $entry.packageName
    if ($result.removed) {
        Write-Output "uninstalled_appx:$($entry.packageName)"
        exit 0
    }
    if ($result.status -eq 'system_app_cannot_remove') {
        Write-Output 'system_app_cannot_remove:This app is part of Windows and cannot be uninstalled.'
        exit 1
    }
    Write-Output 'no_uninstaller_found'
    exit 1
}

$uninstallRoots = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)

foreach ($root in $uninstallRoots) {
    $keys = Get-ItemProperty $root -ErrorAction SilentlyContinue
    foreach ($key in $keys) {
        $displayName = $key.DisplayName
        $uninstall = $key.UninstallString
        if (-not $uninstall) { continue }
        if ($displayName -eq $entry.displayName -or $displayName -eq $entry.processName) {
            if ($uninstall -match 'msiexec') {
                Start-Process 'msiexec.exe' -ArgumentList '/x', ($key.PSChildName), '/qn', '/norestart' -Wait -NoNewWindow
            } else {
                Start-Process cmd.exe -ArgumentList '/c', $uninstall -Wait -NoNewWindow
            }
            Write-Output "uninstalled_win32:$displayName"
            exit 0
        }
    }
}

Write-Output 'no_uninstaller_found'
exit 1
