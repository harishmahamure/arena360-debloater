param([string]$AppJson)

$ErrorActionPreference = 'SilentlyContinue'
. (Join-Path $PSScriptRoot 'appx-remove-helper.ps1')

$app = $AppJson | ConvertFrom-Json

if ($app.appType -eq 'appx' -and $app.packageName) {
    $result = Remove-SafeAppxPackage -PackageName $app.packageName -AllUsers
    switch ($result.status) {
        'removed' { Write-Output "uninstalled_appx:$($app.packageName)"; exit 0 }
        'not_installed' { Write-Output "uninstalled_appx:$($app.packageName)"; exit 0 }
        'system_app_cannot_remove' {
            Write-Output 'system_app_cannot_remove:This app is part of Windows and cannot be uninstalled.'
            exit 1
        }
        default {
            Write-Output 'no_uninstaller_found'
            exit 1
        }
    }
}

if ($app.appType -eq 'win32' -and $app.uninstallKey) {
    $key = Get-ItemProperty -Path $app.uninstallKey -ErrorAction SilentlyContinue
    if (-not $key) {
        Write-Output 'no_uninstaller_found'
        exit 1
    }
    $uninstall = $key.UninstallString
    if (-not $uninstall) {
        Write-Output 'no_uninstaller_found'
        exit 1
    }
    if ($uninstall -match 'msiexec') {
        $guid = $key.PSChildName
        Start-Process 'msiexec.exe' -ArgumentList '/x', $guid, '/qn', '/norestart' -Wait -NoNewWindow
    } else {
        Start-Process cmd.exe -ArgumentList '/c', $uninstall -Wait -NoNewWindow
    }
    Write-Output "uninstalled_win32:$($app.displayName)"
    exit 0
}

if ($app.packageName) {
    $result = Remove-SafeAppxPackage -PackageName $app.packageName
    if ($result.removed) {
        Write-Output "uninstalled_appx:$($app.packageName)"
        exit 0
    }
    if ($result.status -eq 'system_app_cannot_remove') {
        Write-Output 'system_app_cannot_remove:This app is part of Windows and cannot be uninstalled.'
        exit 1
    }
    Write-Output 'no_uninstaller_found'
    exit 1
}

Write-Output 'no_uninstaller_found'
exit 1
