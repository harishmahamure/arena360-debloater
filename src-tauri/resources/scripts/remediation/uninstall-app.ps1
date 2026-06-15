param([string]$AppJson)

$ErrorActionPreference = 'Stop'
$app = $AppJson | ConvertFrom-Json

if ($app.appType -eq 'appx' -and $app.packageName) {
    Get-AppxPackage -Name $app.packageName -AllUsers -ErrorAction SilentlyContinue | Remove-AppxPackage -AllUsers -ErrorAction SilentlyContinue
    if (-not $?) {
        Get-AppxPackage -Name $app.packageName -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
    }
    Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like "*$($app.packageName)*" | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
    Write-Output "uninstalled_appx:$($app.packageName)"
    exit 0
}

if ($app.appType -eq 'win32' -and $app.uninstallKey) {
    $key = Get-ItemProperty -Path $app.uninstallKey -ErrorAction Stop
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
    Get-AppxPackage -Name $app.packageName -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
    Write-Output "uninstalled_appx:$($app.packageName)"
    exit 0
}

Write-Output 'no_uninstaller_found'
exit 1
